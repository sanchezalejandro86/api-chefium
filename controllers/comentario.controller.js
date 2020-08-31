const qs = require("qs");

var Receta = require("../models/receta.model");
var Usuario = require("../models/usuario.model");
var Comentario = require("../models/comentario.model");

const {
  s3Upload
} = require("../helpers/s3");

var findQueryByQueryUrl = (queryUrl, recetaId) => {
  return new Promise(async (resolve, reject) => {
    var findQuery = {};

    if (queryUrl) {
      const objQuery = qs.parse(queryUrl, {
        comma: true,
      });

      const {
        busqueda,
        usuario,

      } = objQuery;

      if (
        busqueda ||
        usuario ||
        recetaId
      ) {
        findQuery = {
          $and: [],
        };

        if (busqueda) {
          let arrayBusqueda = busqueda;
          if (!Array.isArray(arrayBusqueda)) {
            arrayBusqueda = [busqueda];
          }

          let arreglo = [];

          for (const busqueda of arrayBusqueda) {
            let query = `.*${busqueda}.*`;
            arreglo.push({
              contenido: {
                $regex: query,
                $options: 'i',
              },
            });
          }

          findQuery.$and.push({
            $or: arreglo,
          });
        }

        if (usuario) {
          findQuery.$and.push({
            usuario: usuario,
          });
        }

        if (recetaId) {
          findQuery.$and.push({
            receta: recetaId,
          });
        }

      }
    }
    resolve(findQuery);
  });

};

var opcionesByReqQuery = (reqQuery) => {
  const etiquetas = {
    totalDocs: "total",
    docs: "comentarios",
    limit: "limite",
    page: "pagina",
    totalPages: "paginasTotales",
    hasPrevPage: "tieneAnterior",
    hasNextPage: "tieneSiguiente",
    nextPage: false,
    prevPage: false,
    pagingCounter: false,
    meta: false,
  };

  var opciones = {
    page: 1,
    limit: 20,
    lean: true,
    sort: "-creacion",
    select: "-likes -dislikes",
    populate: [{
      path: "creadoPor",
      select: "-favoritas -recetas",
    }, ],
    customLabels: etiquetas,
  };

  if (reqQuery) {
    if (reqQuery.pagina && parseInt(reqQuery.pagina)) {
      opciones.page = parseInt(reqQuery.pagina);
    }
    if (reqQuery.limite && parseInt(reqQuery.limite)) {
      opciones.limit = parseInt(reqQuery.limite);
    }
    if (reqQuery.ordenar) {
      opciones.sort = reqQuery.ordenar.replace(",", " ");
    }
  }

  return opciones;
};

exports.listarTodos = async (req, res) => {
  try {
    let recetaId = req.params.recetaId ? req.params.recetaId : req.query.receta;
    let findQuery = await findQueryByQueryUrl(req.url.split("?")[1], recetaId);

    let resultado = await Comentario.paginate(
      findQuery,
      opcionesByReqQuery(req.query)
    );

    let comentarios = resultado.comentarios.map(comentario => {
      let nuevoComentario = {
        ...comentario
      };
      nuevoComentario.esMio = nuevoComentario.creadoPor ? nuevoComentario.creadoPor._id == req.usuario._id : false;
      return nuevoComentario;
    });

    resultado.comentarios = comentarios;

    res.status(200).json(resultado);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};

exports.obtener = async (req, res) => {
  try {
    let comentario = await Comentario.findById(req.params.comentarioId, "-likes -dislikes")
      .populate({
        path: "creadoPor",
        select: "-favoritas -recetas",
      })
      .lean()
      .exec();

    comentario.esMio = comentario.creadoPor._id == req.usuario._id;


    res.status(200).json(receta);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};

exports.crear = async (req, res) => {
  try {
    if (req.body) {
      let fotoData = req.body.foto;
      delete req.body.foto;

      let recetaId = req.params.recetaId || req.body.receta;

      let receta = await Receta.findById(recetaId);
      if (receta) {
        let comentario = new Comentario(req.body);
        comentario.creadoPor = req.usuario._id;

        await comentario.save();

        // Añade recetaId a las recetas del usuario creador
        if (receta.comentarios == null) {
          receta.comentarios = [];
        }
        receta.comentarios.push(comentario._id);
        receta.numeroComentarios = receta.comentarios.length;
        console.log("receta.comentarios.length", receta.comentarios.length);

        receta.save();

        try {
          if (fotoData) {
            let path = await s3Upload(fotoData, `recetas/${receta._id}/comentarios/${comentario._id}`);
            comentario.foto = path;
            await comentario.save();
          }
        } catch (error) {
          console.log("No se pudo actualizar la foto", error);
        }



        let comentarioPopulated = await Comentario.findById(comentario._id, "-likes -dislikes")
          .populate({
            path: "creadoPor",
            select: "-favoritas -recetas",
          })

          .lean()
          .exec();

        res.status(201).json({
          ...comentarioPopulated,
          ...{
            esMio: true,
          },
        });
      } else {
        res.status(400).json({
          error: "La receta ingresada no existe",
        });
      }
    } else {
      res.status(400).json({
        error: "Debe ingresar datos para crear comentario",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};

exports.actualizar = async (req, res) => {
  try {
    if (req.body) {
      let recetaId = req.params.recetaId || req.body.receta;

      let receta = await Receta.findById(recetaId);
      if (receta) { 
        let comentario = await Comentario.findById(req.params.comentarioId)
          .populate({
            path: "creadoPor",
            select: "-favoritas -recetas",
          })

        if (req.usuario.rol == 0 || comentario.creadoPor._id == req.usuario._id) {
          if (req.body.contenido != null) {
            comentario.contenido = req.body.contenido;
          }

          await comentario.save();

          try {
            if (req.body.foto) {
              let path = await s3Upload(req.body.foto, `recetas/${receta._id}/comentarios/${comentario._id}`);
              comentario.foto = path;
              await comentario.save();
            }
          } catch (error) {
            console.log("No se pudo actualizar la foto", error);
          }

          res.status(201).json({
            ...comentario,
            ...{
              esMio: comentario.creadoPor._id == req.usuario._id,
            },
          });
        } else {
          res.status(403).json({
            error: "No tiene permiso para actualizar este comentario",
          });
        }
      } else {
        res.status(400).json({
          error: "La receta ingresada no existe",
        });
      }
    } else {
      res.status(400).json({
        error: "Debe ingresar los datos a actualizar",
      });
    }
    
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};

exports.eliminar = async (req, res) => {
  try {
    var comentario = await Comentario.findById(req.params.comentarioId).populate("creadoPor receta");
    var receta = await Receta.findById(comentario.receta._id).lean().exec();
    if (req.usuario.rol == 0 || comentario.creadoPor._id == req.usuario._id) {

      const comentariosReceta = receta.comentarios.filter(c => c != comentario._id);
      await comentario.remove();
      await Receta.findByIdAndUpdate(comentario.receta._id, {
        comentarios: comentariosReceta,
        numeroComentarios: comentariosReceta.length,
      });
      res.status(204).json();
    } else {
      res.status(403).json({
        error: "No tiene permiso para eliminar este comentario",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};