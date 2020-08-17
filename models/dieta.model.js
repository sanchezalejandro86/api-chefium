const mongoose = require("mongoose");
const mongooseAutoIncrement = require("mongoose-sequence")(mongoose);

var dietaSchema = mongoose.Schema({
    _id: Number,
    descripcion: {
        type: String,
        unique: true,
        trim: true,
    },
    icono: {
        type: String,
        unique: false,
        trim: true,
    },
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

dietaSchema.plugin(mongooseAutoIncrement, {
    id: 'dietaId'
});

var Dieta = mongoose.model("Dieta", dietaSchema);

module.exports = Dieta;