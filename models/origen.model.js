const mongoose = require("mongoose");
const mongooseAutoIncrement = require("mongoose-sequence")(mongoose);

var origenSchema = mongoose.Schema({
    _id: Number,
    descripcion: {
        type: String,
        unique: true,
        trim: true,
    },
    paisISO3166_1:{
        type: String,
        unique: true,
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

origenSchema.plugin(mongooseAutoIncrement, {
    id: 'origenId'
});

var Origen = mongoose.model("Origen", origenSchema);

module.exports = Origen;