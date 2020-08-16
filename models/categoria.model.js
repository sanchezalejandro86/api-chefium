const mongoose = require("mongoose");
const mongooseAutoIncrement = require("mongoose-sequence")(mongoose);

var categoriaSchema = mongoose.Schema({
    _id: Number,
    descripcion: {
        type: String,
        unique: true,
        trim: true,
    },
    icono: Number,
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

categoriaSchema.plugin(mongooseAutoIncrement, {
    id: 'categoriaId'
});

var Categoria = mongoose.model("Categoria", categoriaSchema);

module.exports = Categoria;