require("dotenv").config();

const appleSignin = require("apple-signin");
const jwt = require("jsonwebtoken");
const google = require("googleapis").google;
const axios = require("axios").default;

const {
  s3Upload
} = require("../helpers/s3");

var Receta = require("../models/receta.model");
var Usuario = require("../models/usuario.model");

var opcionesByQuery = (query) => {
  const etiquetas = {
    totalDocs: "total",
    docs: "usuarios",
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
    limit: 10,
    sort: null,
    lean: true,
    customLabels: etiquetas,
  };

  if (query) {
    if (query.pagina && parseInt(query.pagina)) {
      opciones.page = parseInt(query.pagina);
    }
    if (query.limite && parseInt(query.limite)) {
      opciones.limit = parseInt(query.limite);
    }
    if (query.ordenar) {
      opciones.sort = query.ordenar.replace(",", " ");
    }
  }

  return opciones;
};

exports.listarTodos = async (req, res) => {
  try {
    let usuarios = await Usuario.paginate({}, opcionesByQuery(req.query));

    res.status(200).json(usuarios);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};

exports.obtener = async (req, res) => {
  try {
    let usuario = await Usuario.findById(req.params.usuarioId)
      .populate({
        path: "recetas favoritas",
        select: "-favoritaDe -instancias",
        populate: [{
            path: "categorias dietas origen ingredientes.ingrediente",
            select: "descripcion paisISO3166_1 icono foto",
          },
          {
            path: "usuario",
            select: "nombres apellidos correo foto",
          },
        ],
      })
      .lean()
      .exec();

    usuario.recetas = usuario.recetas.map((receta) => {
      return {
        ...receta,
        ...{
          esMia: true,
          esFavorita: false,
        },
      };
    });

    usuario.favoritas = usuario.favoritas.map((favorita) => {
      return {
        ...favorita,
        ...{
          esMia: false,
          esFavorita: true,
        },
      };
    });

    if (usuario.sigueA == null) {
      usuario.sigueA = [];
    }
    if (usuario.seguidoPor == null) {
      usuario.seguidoPor = [];
    }

    usuario.siguiendo = false;
    usuario.soyYo = usuario._id == req.usuario._id;
    if (!usuario.soyYo) {

      if (usuario.seguidoPor.indexOf(req.usuario._id) != -1) {
        usuario.siguiendo = true;
      }
    }

    res.status(200).json(usuario);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};

exports.obtenerme = async (req, res) => {
  try {
    let usuario = await Usuario.findById(req.usuario._id)
      .populate({
        path: "recetas favoritas",
        select: "-ingredientes -pasos -tips -favoritaDe -instancias",
        populate: [{
            path: "categorias dietas origen",
            select: "descripcion",
          },
          {
            path: "usuario",
            select: "nombres apellidos correo foto",
          },
        ],
      })
      .lean()
      .exec();

    usuario.recetas = usuario.recetas.map((receta) => {
      return {
        ...receta,
        ...{
          esMia: true,
          esFavorita: false,
        },
      };
    });

    usuario.favoritas = usuario.favoritas.map((favorita) => {
      return {
        ...favorita,
        ...{
          esMia: false,
          esFavorita: true,
        },
      };
    });

    if (usuario.sigueA == null) {
      usuario.sigueA = [];
    }
    if (usuario.seguidoPor == null) {
      usuario.seguidoPor = [];
    }

    usuario.siguiendo = false;
    usuario.soyYo = usuario._id == req.usuario._id;
    if (!usuario.soyYo) {

      if (usuario.seguidoPor.indexOf(req.usuario) != -1) {
        usuario.siguiendo = true;
      }
    }

    res.status(200).json(usuario);
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
      let usuario = new Usuario(req.body);

      await usuario.save();

      try {
        if (req.body.foto) {
          var path = await s3Upload(req.body.foto, `usuarios/${usuario._id}`);
          usuario.foto = path;
          await usuario.save();
        }
      } catch (error) {
        console.log("No se pudo guardar la foto", error);
      }

      usuario
        .populate({
          path: "recetas favoritas",
          select: "-ingredientes -pasos -tips -favoritaDe -instancias",
          populate: {
            path: "categorias dietas origen",
            select: "descripcion",
          },
        })
        .lean()
        .exec();

      usuario.recetas = usuario.recetas.map((receta) => {
        return {
          ...receta,
          ...{
            esMia: true,
            esFavorita: false,
          },
        };
      });

      usuario.favoritas = usuario.favoritas.map((favorita) => {
        return {
          ...favorita,
          ...{
            esMia: false,
            esFavorita: true,
          },
        };
      });

      res.status(201).json(usuario);
    } else {
      res.status(400).json({
        error: "Debe ingresar los datos para crear el usuario",
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
      if (req.usuario.rol == 0 || req.usuario._id == req.params.usuarioId) {
        let usuario = await Usuario.findById(req.params.usuarioId).exec();

        if (req.body.nombres != null) {
          usuario.nombres = req.body.nombres;
        }

        if (req.body.apellidos != null) {
          usuario.apellidos = req.body.apellidos;
        }

        if (req.body.correo != null) {
          usuario.correo = req.body.correo;
        }

        if (req.body.enlace != null) {
          usuario.enlace = req.body.enlace;
        }

        if (req.body.biografia != null) {
          usuario.biografia = req.body.biografia;
        }

        if (req.body.hasOwnProperty("facebookId")) {
          usuario.facebookId = req.body.facebookId;
        }

        if (req.body.hasOwnProperty("appleUid")) {
          usuario.appleUid = req.body.appleUid;
        }

        if (req.body.hasOwnProperty("googleId")) {
          usuario.googleId = req.body.googleId;
        }

        await usuario.save();

        try {
          if (req.body.foto) {
            var path = await s3Upload(req.body.foto, `usuarios/${usuario._id}`);
            usuario.foto = path;
            await usuario.save();
          }
        } catch (error) {
          console.log("No se pudo actualizar la foto", error);
        }

        let usuarioPopulated = await Usuario.findById(usuario._id)
          .populate({
            path: "recetas favoritas",
            select: "-ingredientes -pasos -tips -favoritaDe -instancias",
            populate: [{
                path: "categorias dietas origen",
                select: "descripcion",
              },
              {
                path: "usuario",
                select: "nombres apellidos correo foto",
              },
            ],
          })
          .lean()
          .exec();

        usuarioPopulated.recetas = usuarioPopulated.recetas.map((receta) => {
          return {
            ...receta,
            ...{
              esMia: true,
              esFavorita: false,
            },
          };
        });

        usuarioPopulated.favoritas = usuarioPopulated.favoritas.map((favorita) => {
          return {
            ...favorita,
            ...{
              esMia: false,
              esFavorita: true,
            },
          };
        });

        res.status(201).json(usuarioPopulated);
      } else {
        res.status(403).json({
          error: "No tiene permiso para actualizar a este usuario",
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
    if (req.usuario.rol == 0 || req.usuario._id == req.params.usuarioId) {
      await Usuario.findByIdAndDelete(req.params.usuarioId);

      res.status(204).json();
    } else {
      res.status(403).json({
        error: "No tiene permiso para eliminar a este usuario",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};

exports.toggleFavorita = async (req, res) => {
  try {
    if (req.params.usuarioId == req.usuario._id) {
      let usuario = await Usuario.findById(req.usuario._id);
      let receta = await Receta.findById(req.params.recetaId);
      let quedoFavorita;
      let nuevoNumeroFavoritos;

      if (usuario.favoritas == null) {
        usuario.favoritas = [];
      }

      if (receta.usuario != req.usuario._id) {
        if (usuario.favoritas.indexOf(req.params.recetaId) != -1) {
          // Si ya está agregada a favoritos, se elimina
          usuario.favoritas = usuario.favoritas.filter(
            (f) => f != req.params.recetaId
          );
          receta.favoritaDe = receta.favoritaDe.filter(
            (f) => f != req.usuario._id
          );
          receta.numeroFavoritos = receta.numeroFavoritos - 1;

          nuevoNumeroFavoritos = receta.numeroFavoritos;
          quedoFavorita = false;
        } else {
          // Si no está agregada a favoritos, se agrega
          usuario.favoritas.push(req.params.recetaId);
          receta.favoritaDe = req.usuario._id;
          receta.numeroFavoritos = receta.numeroFavoritos + 1;

          nuevoNumeroFavoritos = receta.numeroFavoritos;
          quedoFavorita = true;
        }
        await usuario.save();
        await receta.save();
        res.status(200).json({
          resultado: true,
          quedoFavorita
        });
      } else {
        res.status(400).json({
          error: "No puede añadir a favoritas su propia receta",
        });
      }
    } else {
      res.status(400).json({
        error: "No coinciden los usuarios",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};

exports.toggleSeguir = async (req, res) => {
  try {
    if (req.params.usuarioId != req.usuario._id) {
      let usuarioActual = await Usuario.findById(req.usuario._id);
      let usuarioObjetivo = await Usuario.findById(req.params.usuarioId);
      let quedoSiguiendo;
      let nuevoNumeroSeguidosActual;
      let nuevoNumeroSeguidoresObjetivo;

      if (usuarioObjetivo.seguidoPor == null) {
        usuarioObjetivo.seguidoPor = [];
      }
      if (usuarioObjetivo.sigueA == null) {
        usuarioObjetivo.sigueA = [];
      }

      if (usuarioActual.seguidoPor == null) {
        usuarioActual.seguidoPor = [];
      }
      if (usuarioActual.sigueA == null) {
        usuarioActual.sigueA = [];
      }

      if (usuarioObjetivo.seguidoPor.indexOf(req.usuario._id) != -1) {
        // Si ya lo está siguiendo, se elimina
        usuarioObjetivo.seguidoPor = usuarioObjetivo.seguidoPor.filter(
          (f) => f != req.usuario._id
        );
        usuarioObjetivo.numeroSeguidores = usuarioObjetivo.numeroSeguidores != null ? (usuarioObjetivo.numeroSeguidores - 1) : 0;

        usuarioActual.sigueA = usuarioActual.sigueA.filter(
          (f) => f != req.params.usuarioId
        );
        usuarioActual.numeroSeguidos = usuarioActual.numeroSeguidos != null ? (usuarioActual.numeroSeguidos - 1) : 0;


        quedoSiguiendo = false;
      } else {
        // Si no está agregada a favoritos, se agrega
        usuarioObjetivo.seguidoPor.push(req.usuario._id);
        usuarioObjetivo.numeroSeguidores = usuarioObjetivo.numeroSeguidores != null ? (usuarioObjetivo.numeroSeguidores + 1) : 1;

        usuarioActual.sigueA.push(req.params.usuarioId);
        usuarioActual.numeroSeguidos = usuarioActual.numeroSeguidos != null ? (usuarioActual.numeroSeguidos + 1) : 1;

        quedoSiguiendo = true;
      }
      nuevoNumeroSeguidosActual = usuarioActual.numeroSeguidos;
      nuevoNumeroSeguidoresObjetivo = usuarioObjetivo.numeroSeguidores;

      await usuarioObjetivo.save();
      await usuarioActual.save();
      res.status(200).json({
        resultado: true,
        quedoSiguiendo,
        nuevoNumeroSeguidosActual,
        nuevoNumeroSeguidoresObjetivo
      });
    } else {
      res.status(400).json({
        error: "No pueden coincidir los usuarios",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};

exports.loginFacebook = async (req, res) => {
  try {
    if (req.body && req.body.token) {
      let usuario;

      let respuesta = await axios.get(
        `https://graph.facebook.com/v2.12/me?fields=id,email,first_name,last_name,picture&access_token=${req.body.token}`
      );

      let busqueda = await Usuario.findOne({
        $or: [{
            facebookId: respuesta.data.id,
          },
          {
            correo: respuesta.data.email,
          },
        ],
      }).exec();

      if (busqueda) {
        if (!busqueda.facebookId) {
          busqueda.facebookId = respuesta.data.id;
        }
        if (!busqueda.nombres) {
          busqueda.nombres = respuesta.data.first_name;
        }
        if (!busqueda.apellidos) {
          busqueda.apellidos = respuesta.data.last_name;
        }
        usuario = busqueda;
      } else {
        usuario = new Usuario({
          nombres: respuesta.data.first_name,
          apellidos: respuesta.data.last_name,
          facebookId: respuesta.data.id,
          correo: respuesta.data.email,
        });
      }

      await usuario.save();

      if (!usuario.foto) {
        if (
          respuesta.data.picture &&
          respuesta.data.picture.data &&
          !respuesta.data.picture.data.is_silhouette
        ) {
          try {
            let imagen = await axios.get(
              `https://graph.facebook.com/v2.12/${respuesta.data.id}/picture?type=large`, {
                responseType: "arraybuffer",
              });
            let imagenBuff = imagen.data;

            console.log(`https://graph.facebook.com/v2.12/${respuesta.data.id}/picture?type=large`);
            console.log(imagenBuff);

            if (imagenBuff) {
              let fotoData = imagenBuff.toString('base64');
              var path = await s3Upload(fotoData, `usuarios/${usuario._id}`);
              usuario.foto = path;
              await usuario.save();
            }
          } catch (error) {
            console.log("No se pudo guardar la foto", error);
          }


        }
      }

      usuario = await Usuario.findById(usuario._id)
        .populate({
          path: "recetas favoritas",
          select: "-ingredientes -pasos -tips -favoritaDe -instancias",
          populate: {
            path: "categorias dietas origen",
            select: "descripcion",
          },
        })
        .lean()
        .exec();

      usuario.recetas = usuario.recetas.map((receta) => {
        return {
          ...receta,
          ...{
            esMia: true,
            esFavorita: false,
          },
        };
      });

      usuario.favoritas = usuario.favoritas.map((favorita) => {
        return {
          ...favorita,
          ...{
            esMia: false,
            esFavorita: true,
          },
        };
      });

      let token = jwt.sign({
          _id: usuario._id,
          rol: usuario.rol == "administrador" ? 0 : 1,
        },
        process.env.JWT_SECRETO, {
          expiresIn: process.env.JWT_CADUCIDAD,
        }
      );

      res.status(200).json({
        ...{
          token,
        },
        ...usuario,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error,
    });
  }
};

exports.loginGoogle = async (req, res) => {
  try {
    if (req.body && req.body.token) {
      let usuario;

      console.log(req.body.token);

      var OAuth2 = google.auth.OAuth2;
      var oauth2Client = new OAuth2();
      oauth2Client.setCredentials({
        access_token: req.body.token,
      });
      var oauth2 = google.oauth2({
        auth: oauth2Client,
        version: "v2",
      });

      oauth2.userinfo.get(async (err, respuesta) => {
        if (err) {
          throw err;
        }

        console.log(respuesta.data);

        let busqueda = await Usuario.findOne({
          $or: [{
              googleId: respuesta.data.id,
            },
            {
              correo: respuesta.data.email,
            },
          ],
        }).exec();

        if (busqueda) {
          if (!busqueda.googleId) {
            busqueda.googleId = respuesta.data.id;
          }
          usuario = busqueda;
        } else {
          usuario = new Usuario({
            googleId: respuesta.data.id,
            correo: respuesta.data.email,
            nombres: respuesta.data.given_name,
            apellidos: respuesta.data.family_name
          });
        }

        await usuario.save();

        if (!usuario.foto) {
          if (respuesta.data.picture) {
            try {
              let imagen = await axios.get(
                respuesta.data.picture, {
                  responseType: "arraybuffer",
                });
              let imagenBuff = imagen.data;
              console.log(imagenBuff);

              if (imagenBuff) {
                let fotoData = imagenBuff.toString('base64');
                var path = await s3Upload(fotoData, `usuarios/${usuario._id}`);
                usuario.foto = path;
                await usuario.save();
              }
            } catch (error) {
              console.log("No se pudo guardar la foto", error);
            }
          }
        }

        usuario = await Usuario.findById(usuario._id)
          .populate({
            path: "recetas favoritas",
            select: "-ingredientes -pasos -tips -favoritaDe -instancias",
            populate: {
              path: "categorias dietas origen",
              select: "descripcion",
            },
          })
          .lean()
          .exec();

        usuario.recetas = usuario.recetas.map((receta) => {
          return {
            ...receta,
            ...{
              esMia: true,
              esFavorita: false,
            },
          };
        });

        usuario.favoritas = usuario.favoritas.map((favorita) => {
          return {
            ...favorita,
            ...{
              esMia: false,
              esFavorita: true,
            },
          };
        });

        let token = jwt.sign({
            _id: usuario._id,
            rol: usuario.rol == "administrador" ? 0 : 1,
          },
          process.env.JWT_SECRETO, {
            expiresIn: process.env.JWT_CADUCIDAD,
          }
        );

        res.status(200).json({
          token,
          ...usuario,
        });
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error,
    });
  }
};

exports.loginApple = async (req, res) => {
  try {
    if (req.body && req.body.token) {
      let usuario;

      let resultado = await appleSignin.verifyIdToken(
        req.body.token,
        process.env.APPLE_APP_ID
      );

      let busqueda = await Usuario.findOne({
        $or: [{
            appleUid: resultado.sub,
          },
          {
            correo: resultado.email,
          },
        ],
      }).exec();

      console.log(busqueda);

      if (busqueda) {
        if (!busqueda.appleUid) {
          busqueda.appleUid = resultado.sub;
        }
        if (req.body.nombres && !busqueda.nombres) {
          busqueda.nombres = req.body.nombres;
        }
        if (req.body.apellidos && !busqueda.apellidos) {
          busqueda.apellidos = req.body.apellidos;
        }

        usuario = busqueda;
      } else {
        usuario = new Usuario({
          appleUid: resultado.sub,
          correo: resultado.email,
        });
        if (req.body.nombres) {
          usuario.nombres = req.body.nombres;
        }
        if (req.body.apellidos) {
          usuario.apellidos = req.body.apellidos;
        }
      }

      await usuario.save();

      usuario = await Usuario.findById(usuario._id)
        .populate({
          path: "recetas favoritas",
          select: "-ingredientes -pasos -tips -favoritaDe -instancias",
          populate: {
            path: "categorias dietas origen",
            select: "descripcion",
          },
        })
        .lean()
        .exec();

      usuario.recetas = usuario.recetas.map((receta) => {
        return {
          ...receta,
          ...{
            esMia: true,
            esFavorita: false,
          },
        };
      });

      usuario.favoritas = usuario.favoritas.map((favorita) => {
        return {
          ...favorita,
          ...{
            esMia: false,
            esFavorita: true,
          },
        };
      });

      let token = jwt.sign({
          _id: usuario._id,
          rol: usuario.rol == "administrador" ? 0 : 1,
        },
        process.env.JWT_SECRETO, {
          expiresIn: process.env.JWT_CADUCIDAD,
        }
      );

      res.status(200).json({
        token,
        ...usuario,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error,
    });
  }
};

exports.login = async (req, res) => {  
  try {    
    console.log(req.body);    
    if (req.body && req.body.username && req.body.password) {      
      let usuario;
   
      let busqueda = await Usuario.findOne({          
          $and: [{              
            correo: req.body.username,            
          },
          { 
            clave: req.body.password,            
          },          
        ],        
      })        
      .populate("recetas")        
      .populate("favoritas");
      
      console.log(busqueda);

      if (busqueda) {        
        usuario = busqueda;                
        let token = jwt.sign({            
            _id: usuario._id,            
            rol: usuario.rol == "administrador" ? 0 : 1,          
          },          
          process.env.JWT_SECRETO, {            
            expiresIn: process.env.JWT_CADUCIDAD,          
          }        
        );
            
        res.status(200).json({          
          token,          
          ...usuario._doc,        
        });      
      }else{        
        res.status(403).json("Wrong credentials");       
      }    
    }  
  } catch (error) {    
    console.log(error);    
    res.status(500).json({      
      error,    
    });  
  }
};