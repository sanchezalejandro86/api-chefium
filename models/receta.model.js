const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
const mongooseAutoIncrement = require("mongoose-sequence")(mongoose);

var recetaSchema = mongoose.Schema({
  _id: Number,
  titulo: {
    type: String,
    required: true
  },
  descripcion: String,
  usuario: {
    type: Number,
    ref: "Usuario",
    required: true,
  },
  favoritaDe: [{
    type: Number,
    ref: "Usuario",
  }],
  numeroFavoritos: {
    type: Number,
    default: 0,
  },
  categorias: [{
    type: Number,
    ref: "Categoria"
  }],
  dietas: [{
    type: Number,
    ref: "Dieta"
  }],
  numeroComentarios: {
    type: Number,
    default: 0,
  },
  comentarios: [{
    type: Number,
    ref: "Comentario"
  }],
  porciones: {
    type: Number,
    required: true,

  },
  tiempoPreparacionMinutos: {
    type: Number,
    required: true,
  },
  origen: {
    type: Number,
    ref: "Origen",
  },
  ingredientes: [{
    ingrediente: {
      type: Number,
      ref: 'Ingrediente'
    },
    cantidad: Number,
    medida: String
  }],
  foto: {
    type: String,
    required: false,
  },
  pasos: [{
    orden: {
      type: Number
    },
    descripcion: {
      type: String
    },
    fotos: [{
      type: String,
      required: false,

    }],
  }],
  tips: {
    type: String,
    required: false
  }
}, {
  _id: false,
  timestamps: {
    createdAt: "creacion",
    updatedAt: "actualizacion",
  },
});

recetaSchema.plugin(mongooseAutoIncrement, {
  id: 'recetaId'
});
recetaSchema.plugin(mongoosePaginate);

var Receta = mongoose.model('Receta', recetaSchema);

module.exports = Receta;