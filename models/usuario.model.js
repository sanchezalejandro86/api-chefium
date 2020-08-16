const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
const mongooseAutoIncrement = require("mongoose-sequence")(mongoose);

var usuarioSchema = mongoose.Schema({
  _id: Number,
  nombres: {
    type: String,
    trim: true,
  },
  apellidos: {
    type: String,
    trim: true,
  },
  biografia: {
    type: String,
    trim: true,
  },
  enlace: {
    type: String,
    trim: true,
  },
  numeroSeguidos: {
    type: Number,
    default: 0,
  },
  sigueA: [{
    type: Number,
    ref: "Usuario",
  }],
  seguidoPor: [{
    type: Number,
    ref: "Usuario",
  }],
  numeroSeguidores: {
    type: Number,
    default: 0,
  },
  correo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  facebookId: {
    type: String,
    required: false,
    unique: true,
    index: true,
    sparse: true,
  },
  appleUid: {
    type: String,
    required: false,
    unique: true,
    index: true,
    sparse: true,
  },
  googleId: {
    type: String,
    required: false,
    index: true,
    unique: true,
    sparse: true,
  },
  rol: {
    type: String,
    default: "usuario"
  },
  foto: String,
  recetas: [{
    type: Number,
    ref: "Receta",
  }],
  favoritas: [{
    type: Number,
    ref: "Receta",
  }],
}, {
  _id: false,
  timestamps: {
    createdAt: "creacion",
    updatedAt: "actualizacion",
  },
});

usuarioSchema.plugin(mongooseAutoIncrement, {
  id: 'usuarioId'
});
usuarioSchema.plugin(mongoosePaginate);

var Usuario = mongoose.model("Usuario", usuarioSchema);

module.exports = Usuario;