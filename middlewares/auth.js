const jwt = require("jsonwebtoken");
const moment = require("moment");

let verificarUsuario = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(403).json({
      error: "Tu petición no tiene cabecera de autorización",
    });
  }

  var token = req.headers.authorization.split(" ")[1];

  try {
    var payload = jwt.decode(token, process.env.JWT_SECRETO);
    if (payload.exp <= moment().unix()) {
      return res.status(401).send({
        error: "EL token ha expirado",
      });
    }
    req.usuario = payload;
    console.log(payload);
    next();
  } catch (ex) {
    return res.status(404).send({
      error: "EL token no es valido",
    });
  }
};

let verificarAdministrador = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(403).json({
      error: "Tu petición no tiene cabecera de autorización",
    });
  }

  var token = req.headers.authorization.split(" ")[1];

  try {
    var payload = jwt.decode(token, process.env.JWT_SECRETO);
    if (payload.exp <= moment().unix()) {
      return res.status(401).send({
        error: "EL token ha expirado",
      });
    }
    if (payload.rol == 0) {
      req.usuario = payload;
      next();
    } else {
      return res.status(401).send({
        error: "No tienes los permisos suficientes",
      });
    }
  } catch (ex) {
    return res.status(404).send({
      error: "EL token no es valido",
    });
  }
};

module.exports = {
  verificarUsuario,
  verificarAdministrador,
};