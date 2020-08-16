const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
const mongooseAutoIncrement = require("mongoose-sequence")(mongoose);

var ingredienteSchema = mongoose.Schema({
  _id: Number,
  descripcion: {
    type: String,
    unique: true,
    trim: true,
  },
  foto: String,
  creadoPor: {
    type: Number,
    ref: "Usuario",
  },
  actualizadoPor: {
    type: Number,
    ref: "Usuario",
  },
}, {
  _id: false,
  timestamps: {
    createdAt: "creacion",
    updatedAt: "actualizacion",
  },
});

ingredienteSchema.plugin(mongooseAutoIncrement, {
  id: 'ingredienteId'
});

var Ingrediente = mongoose.model("Ingrediente", ingredienteSchema);

module.exports = Ingrediente;