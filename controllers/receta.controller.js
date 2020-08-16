const qs = require("qs");

var Receta = require("../models/receta.model");
var Usuario = require("../models/usuario.model");
var Ingrediente = require("../models/ingrediente.model");

const {
  s3Upload
} = require("../helpers/s3");

var findQueryByQueryUrl = (queryUrl, usuarioId) => {
  return new Promise(async (resolve, reject) => {
    var findQuery = {};

    if (queryUrl) {
      const objQuery = qs.parse(queryUrl, {
        comma: true,
      });

      const {
        busqueda,
        dietas,
        usuario,
        categorias,
        ingredientes,
        origenes,
        soloSeguidos,
      } = objQuery;

      if (
        busqueda ||
        dietas ||
        categorias ||
        origenes ||
        usuario ||
        soloSeguidos ||
        ingredientes
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
              titulo: {
                $regex: query,
              },
            }, {
              descripcion: {
                $regex: query,
              },
            }, {
              "origen.descripcion": {
                $regex: query,
              },
            }, {
              "dietas.descripcion": {
                $regex: query,
              },
            }, {
              "categorias.descripcion": {
                $regex: query,
              },
            }, {
              "usuario.nombres": {
                $regex: query,
              },
            }, {
              "usuario.apellidos": {
                $regex: query,
              },
            }, {
              "pasos.descripcion": {
                $regex: query,
              },
            }, {
              "instancias.nombre": {
                $regex: query,
              },
            }, {
              "instancias.ingredientes.ingrediente.descripcion": {
                $regex: query,
              },
            }, {
              tips: {
                $regex: query,
              },
            });
          }

          findQuery.$and.push({
            $or: arreglo,
          });
        }

        if (soloSeguidos) {
          const usuario = await Usuario.findById(usuarioId).lean().exec();
          console.log(usuario.sigueA);
          findQuery.$and.push({
            usuario: {
              $in: usuario.sigueA
            }
          });
        }

        if (usuario) {
          findQuery.$and.push({
            usuario: usuario,
          });
        }

        if (dietas) {
          findQuery.$and.push({
            dietas: {
              $in: dietas,
            },
          });
        }
        if (categorias) {
          findQuery.$and.push({
            categorias: {
              $in: categorias,
            },
          });
        }
        if (origenes) {
          findQuery.$and.push({
            origen: {
              $in: origenes,
            },
          });
        }
        if (ingredientes) {
          let ingredientesQuery = {
            $and: [{
              "ingredientes.ingrediente": {
                $in: ingredientes,
              },
            }, ],
          };
          let cantidadQuery = {};
          cantidadQuery[`ingredientes.${ingredientes.length}`] = {
            $exists: false,
          };
          ingredientesQuery.$and.push(cantidadQuery);
          findQuery.$and.push(ingredientesQuery);
        }
      }
    }
    resolve(findQuery);
  });

};

var opcionesByReqQuery = (reqQuery) => {
  const etiquetas = {
    totalDocs: "total",
    docs: "recetas",
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
    sort: null,
    select: "-ingredientes -pasos -tips -favoritaDe",
    populate: [{
        path: "usuario",
        select: "-favoritas -recetas",
      },
      {
        path: "categorias dietas origen",
        select: "descripcion paisISO3166_1 icono foto",
      },
    ],
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

exports.listarTodas = async (req, res) => {
  try {
    let usuario;
    if (req.usuario) {
      usuario = await Usuario.findById(req.usuario._id);
    }

    let findQuery = await findQueryByQueryUrl(req.url.split("?")[1], req.usuario._id);

    let resultado = await Receta.paginate(
      findQuery,
      opcionesByReqQuery(req.query)
    );

    let recetas = [...resultado.recetas];
    let recetasFinal = recetas.map((receta) => {
      let nuevaReceta;
      if (usuario) {
        nuevaReceta = {
          ...receta,
          ...{
            esMia: receta.usuario._id == usuario._id,

            esFavorita: usuario.favoritas.indexOf(receta._id) != -1,
          },
        };
      } else {
        nuevaReceta = receta;
      }
      return nuevaReceta;
    });

    resultado.recetas = recetasFinal;

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
    let usuario;
    if (req.usuario) {
      usuario = await Usuario.findById(req.usuario._id);
    }

    let receta = await Receta.findById(req.params.recetaId, "-favoritaDe")
      .populate({
        path: "usuario",
        select: "-favoritas -recetas",
      })
      .populate({
        path: "categorias dietas origen ingredientes.ingrediente",
        select: "descripcion paisISO3166_1 icono foto",
      })
      .lean()
      .exec();

    if (usuario) {
      receta.esMia = receta.usuario._id == usuario._id;
      receta.esFavorita = usuario.favoritas.indexOf(receta._id) != -1;
    }

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

      let pasosSinFotos = req.body.pasos.map((paso) => {
        let pasoSinFoto = {
          ...paso,
        };
        delete pasoSinFoto.fotos;
        return pasoSinFoto;
      });

      let pasosConFotos = [...req.body.pasos];
      req.body.pasos = pasosSinFotos;

      let receta = new Receta(req.body);
      receta.usuario = req.usuario._id;

      await receta.save();

      // Añade recetaId a las recetas del usuario creador
      let usuario = await Usuario.findById(req.usuario._id, "recetas");
      usuario.recetas.push(receta._id);
      usuario.save();

      try {
        if (fotoData) {
          let path = await s3Upload(fotoData, `recetas/${receta._id}`);
          receta.foto = path;
          await receta.save();
        }
      } catch (error) {
        console.log("No se pudo actualizar la foto", error);
      }

      try {
        if (pasosConFotos) {
          let nuevosPasosPromises = pasosConFotos.map(async (paso, i) => {
            return new Promise(async (resolve, reject) => {
              let nuevoPaso = {
                ...paso,
              };
              if (nuevoPaso.fotos) {
                let fotosPromises = nuevoPaso.fotos.map((foto, j) => {
                  if (foto != null) {
                    return s3Upload(foto, `pasos/${receta._id}/${i}/${j}`);
                  } else {
                    return null;
                  }
                });
                nuevoPaso.fotos = await Promise.all(fotosPromises);
                resolve(nuevoPaso);
              } else {
                resolve(nuevoPaso);
              }
            });
          });
          let nuevosPasos = await Promise.all(nuevosPasosPromises);
          receta.pasos = nuevosPasos;

          await receta.save();
        } else {
          console.log("Sin fotos");
        }
      } catch (error) {
        console.log("No se pudieron crear las fotos de los pasos", error);
      }

      let recetaPopulated = await Receta.findById(receta._id, "-favoritaDe")
        .populate({
          path: "usuario",
          select: "-favoritas -recetas",
        })
        .populate({
          path: "categorias dietas origen ingredientes.ingrediente",
          select: "descripcion paisISO3166_1 icono foto",
        })
        .lean()
        .exec();

      res.status(201).json({
        ...recetaPopulated,
        ...{
          esMia: true,
          esFavorita: false,
        },
      });
    } else {
      res.status(400).json({
        error: "Debe ingresar datos para crear receta",
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
      let receta = await Receta.findById(req.params.recetaId)
        .populate({
          path: "usuario",
          select: "-favoritas -recetas",
        })
        .populate({
          path: "categorias dietas origen ingredientes.ingrediente",
          select: "descripcion paisISO3166_1 icono foto",
        }).lean().exec();

      const pasosConFotosOriginales = receta.pasos;

      if (req.usuario.rol == 0 || receta.usuario._id == req.usuario._id) {
        if (req.body.titulo != null) {
          receta.titulo = req.body.titulo;
        }

        if (req.body.descripcion != null) {
          receta.descripcion = req.body.descripcion;
        }

        if (req.body.momentoComida != null) {
          receta.momentoComida = req.body.momentoComida;
        }

        if (req.body.dietas != null) {
          receta.dietas = req.body.dietas;
        }

        if (req.body.raciones != null) {
          receta.raciones = req.body.raciones;
        }

        if (req.body.origen != null) {
          receta.origen = req.body.origen;
        }

        if (req.body.pasos != null) {
          receta.pasos = req.body.pasos.map(paso => {
            return {
              descripcion: paso.descripcion,
              orden: paso.orden
            }
          });
        }

        await Receta.findByIdAndUpdate(req.params.recetaId, receta);

        console.log(req.body);

        try {
          if (req.body.foto) {
            let value;
            if (req.body.foto == "") {
              value = null;
            } else {
              value = await s3Upload(req.body.foto, `recetas/${receta._id}`);
            }
            receta.foto = value;
            await Receta.findByIdAndUpdate(req.params.recetaId, receta);
          }
        } catch (error) {
          console.log("No se pudo actualizar la foto", error);
        }

        try {
          if (Array.isArray(req.body.pasos) && req.body.pasos.length > 0) {
            let nuevosPasos = req.body.pasos.map((paso, j) => {
              return new Promise(async (resolve, reject) => {
                if (Array.isArray(paso.fotos) && paso.fotos.length > 0) {
                  let fotosPromises = paso.fotos.map((foto, i) => {
                    if (foto != null) {
                      if (foto == "") {
                        return "";
                      } else {
                        return s3Upload(foto, `pasos/${receta._id}/${i}`);
                      }
                    } else {
                      return null;
                    }
                  });
                  let fotosNuevas = await Promise.all(fotosPromises);
                  for (let i = 0; i < 3; i++) {
                    paso.fotos[i] = fotosNuevas[i] ? (fotosNuevas[i] == "" ? null : fotosNuevas[i]) : pasosConFotosOriginales[j].fotos[i];
                  }
                  resolve(paso);
                } else {
                  resolve(paso);
                }
              });
            });
            receta.pasos = await Promise.all(nuevosPasos);

            await Receta.findByIdAndUpdate(req.params.recetaId, receta);
          }
        } catch (error) {
          console.log(
            "No se pudieron actualizar las fotos de los pasos",
            error
          );
        }

        res.status(201).json({
          ...receta,
          ...{
            esMia: true,
            esFavorita: false,
          },
        });
      } else {
        res.status(403).json({
          error: "No tiene permiso para actualizar esta receta",
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
    var receta = await Receta.findById(req.params.recetaId).populate("usuario");
    if (req.usuario.rol == 0 || receta.usuario._id == req.usuario._id) {
      await receta.remove();
      res.status(204).json();
    } else {
      res.status(403).json({
        error: "No tiene permiso para eliminar esta receta",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};