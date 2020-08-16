const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');
const mongooseAutoIncrement = require("mongoose-sequence")(mongoose);

var comentarioSchema = mongoose.Schema({
    _id: Number,
    contenido: {
        type: String,
        trim: true,
    },
    numeroLikes: {
        type: Number,
        default: 0,
    },
    numeroDislikes: {
        type: Number,
        default: 0,
    },
    receta: {
        type: Number,
        ref: "Receta",
    },
    foto: {
        type: String,
        required: false,
    },
    likes: [{
        type: Number,
        ref: "Usuario",
    }],
    dislikes: [{
        type: Number,
        ref: "Usuario",
    }],
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

comentarioSchema.plugin(mongooseAutoIncrement, {
    id: 'comentarioId'
});
comentarioSchema.plugin(mongoosePaginate);

var Comentario = mongoose.model("Comentario", comentarioSchema);

module.exports = Comentario;