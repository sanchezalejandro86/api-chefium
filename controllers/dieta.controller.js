require("dotenv").config();

var Dieta = require("../models/dieta.model");

exports.listarTodas = async (req, res) => {
  try {
    let dietas = await Dieta.find();
    res.status(200).json(dietas);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};

exports.obtener = async (req, res) => {
  try {
    let dieta = await Dieta.findById(req.params.dietaId);
    res.status(200).json(dieta);
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
      let nuevasDietas = req.body;
      if (!nuevasDietas.length) {
        // Si solo tiene un elemento
        nuevasDietas = [nuevasDietas];
      }
      for (const nuevaDieta of nuevasDietas) {
        let dieta = new Dieta(nuevaDieta);
        dieta.creadoPor = req.usuario._id;
        dieta.actualizadoPor = req.usuario._id;

        await dieta.save();
        console.log(
          `Nueva dieta creada correctamente: ${dieta.descripcion}`
        );
      }

      let dietas = await Dieta.find();
      res.status(201).json(dietas);
    } else {
      res.status(400).json({
        error: "Debe ingresar los datos para crear la dieta"
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
      let dieta = await Dieta.findById(req.params.dietaId);
      if (req.body.descripcion) {
        dieta.descripcion = req.body.descripcion;
      }
      if (req.body.icono) {
        dieta.icono = req.body.icono;
      }
      dieta.actualizadoPor = req.usuario._id;
      await dieta.save();
      console.log(
        `Dieta actualizada correctamente: ${dieta.descripcion}`
      );
      res.status(201).json(dieta);
    } else {
      res.status(400).json({
        error: "Debe ingresar los datos para actualizar la dieta"
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
    await Dieta.findByIdAndDelete(req.params.dietaId);
    res.status(204).json();

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};