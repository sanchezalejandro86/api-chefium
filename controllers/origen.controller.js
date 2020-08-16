require("dotenv").config();

var Origen = require("../models/origen.model");

exports.listarTodos = async (req, res) => {
  try {
    let origenes = await Origen.find();
    res.status(200).json(origenes);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};

exports.obtener = async (req, res) => {
  try {
    let origen = await Origen.findById(req.params.origenId);
    res.status(200).json(origen);
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
      let nuevosOrigenes = req.body;
      if (!nuevosOrigenes.length) {
        // Si solo tiene un elemento
        nuevosOrigenes = [nuevosOrigenes];
      }
      for (const nuevoOrigen of nuevosOrigenes) {
        let origen = new Origen(nuevoOrigen);
        origen.creadoPor = req.usuario._id;
        origen.actualizadoPor = req.usuario._id;

        await origen.save();
        console.log(
          `Nuevo origen creado correctamente: ${origen.descripcion}`
        );
      }

      let origenes = await Origen.find();
      res.status(201).json(origenes);
    } else {
      res.status(400).json({
        error: "Debe ingresar los datos para crear el origen"
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
      let origen = await Origen.findById(req.params.origenId);
      if (req.body.descripcion) {
        origen.descripcion = req.body.descripcion;
      }
      origen.actualizadoPor = req.usuario._id;
      await origen.save();
      console.log(
        `Origen actualizado correctamente: ${origen.descripcion}`
      );
      res.status(201).json(origen);
    } else {
      res.status(400).json({
        error: "Debe ingresar los datos para actualizar el origen"
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
    await Origen.findByIdAndDelete(req.params.origenId);
    res.status(204).json();

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};