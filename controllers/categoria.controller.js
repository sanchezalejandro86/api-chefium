require("dotenv").config();

var Categoria = require("../models/categoria.model");

exports.listarTodas = async (req, res) => {
  try {
    let categorias = await Categoria.find();
    res.status(200).json(categorias);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};

exports.obtener = async (req, res) => {
  try {
    let categoria = await Categoria.findById(req.params.categoriaId);
    res.status(200).json(categoria);
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
      let nuevasCategorias = req.body;
      if (!nuevasCategorias.length) {
        // Si solo tiene un elemento
        nuevasCategorias = [nuevasCategorias];
      }
      for (const nuevaCategoria of nuevasCategorias) {
        let categoria = new Categoria(nuevaCategoria);
        categoria.creadoPor = req.usuario._id;
        categoria.actualizadoPor = req.usuario._id;
        await categoria.save();
        console.log(
          `Nueva categoria creada correctamente: ${categoria.descripcion}`
        );
      }

      let categorias = await Categoria.find();
      res.status(201).json(categorias);
    } else {
      res.status(400).json({
        error: "Debe ingresar los datos para crear la categoria"
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
      let categoria = await Categoria.findById(req.params.categoriaId);
      if (req.body.descripcion) {
        categoria.descripcion = req.body.descripcion;
      }
      categoria.actualizadoPor = req.usuario._id;
      await categoria.save();
      console.log(
        `Categoria actualizada correctamente: ${categoria.descripcion}`
      );
      res.status(201).json(categoria);
    } else {
      res.status(400).json({
        error: "Debe ingresar los datos para actualizar la categoria"
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
    await Categoria.findByIdAndDelete(req.params.categoriaId);
    res.status(204).json();

  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  }
};