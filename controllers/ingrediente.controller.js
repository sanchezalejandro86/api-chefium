require("dotenv").config();

var Ingrediente = require("../models/ingrediente.model");

exports.listarTodos = async (req, res) => {
  try {
    let ingredientes = await Ingrediente.find();
    res.status(200).json(ingredientes);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};

exports.obtener = async (req, res) => {
  try {
    let ingrediente = await Ingrediente.findById(req.params.ingredienteId);
    res.status(200).json(ingrediente);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};

exports.crear = async (req, res) => {
  try {
    if (req.usuario) {
      if (req.body) {
        let ingrediente = new Ingrediente(req.body);
        await ingrediente.save();

        try {
          if (req.body.foto) {
            var path = await s3Upload(req.body.foto, `ingredientes/${ingrediente._id}`);
            ingrediente.foto = path;
            await ingrediente.save();
          }
        } catch (error) {
          console.log("No se pudo crear la foto", error);
        }

        res.status(201).json(ingrediente);
      } else {
        res.status(400).json({
          error: "Debe ingresar los datos para crear el ingrediente"
        });
      }
    } else {
      res.status(400).json({
        error: "No está autorizado para realizar esta operación"
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
      let ingrediente = await Ingrediente.findById(req.params.ingredienteId);
      if (req.body.descripcion) {
        ingrediente.descripcion = req.body.descripcion;
      }
      await ingrediente.save();

      try {
        if (req.body.foto) {
          var path = await s3Upload(req.body.foto, `ingredientes/${ingrediente._id}`);
          ingrediente.foto = path;
          await ingrediente.save();
        }
      } catch (error) {
        console.log("No se pudo actualizar la foto", error);
      }

      res.status(200).json(ingrediente);
    } else {
      res.status(400).json({
        error: "Debe ingresar los datos para actualizar el ingrediente"
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
    await Ingrediente.findByIdAndDelete(req.params.ingredienteId);
    res.status(204).json();

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};