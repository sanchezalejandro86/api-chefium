const express = require("express");
const multipart = require("connect-multiparty");

const usuario = require("../controllers/usuario.controller");
const receta = require("../controllers/receta.controller");
const categoria = require("../controllers/categoria.controller");
const dieta = require("../controllers/dieta.controller");
const origen = require("../controllers/origen.controller");
const ingrediente = require("../controllers/ingrediente.controller");
const comentario = require("../controllers/comentario.controller");

const {
  verificarUsuario,
  verificarAdministrador
} = require("../middlewares/auth");

const router = express.Router();

router.get("/usuarios", verificarUsuario, usuario.listarTodos);
router.get("/usuarios/yo", verificarUsuario, usuario.obtenerme);
router.get("/usuarios/:usuarioId", verificarUsuario, usuario.obtener);
router.post("/usuarios", verificarAdministrador, usuario.crear);
router.put("/usuarios/:usuarioId", verificarUsuario, usuario.actualizar);
router.delete("/usuarios/:usuarioId", verificarUsuario, usuario.eliminar);
router.put("/usuarios/:usuarioId/favoritas/:recetaId", verificarUsuario, usuario.toggleFavorita);
router.put("/usuarios/:usuarioId/seguir", verificarUsuario, usuario.toggleSeguir);
router.post("/usuarios/login/facebook", usuario.loginFacebook);
router.post("/usuarios/login/apple", usuario.loginApple);
router.post("/usuarios/login/google", usuario.loginGoogle);
router.post("/usuarios/login", usuario.login);

// Recetas
router.get("/recetas", verificarUsuario, receta.listarTodas);
router.get("/recetas/:recetaId", verificarUsuario, receta.obtener);
router.post("/recetas", verificarUsuario, receta.crear);
router.put("/recetas/:recetaId", verificarUsuario, receta.actualizar);
router.delete("/recetas/:recetaId", verificarUsuario, receta.eliminar);

// Categorias
router.get("/categorias", categoria.listarTodas);
router.get("/categorias/:categoriaId", categoria.obtener);
router.post("/categorias", verificarAdministrador, categoria.crear);
router.put("/categorias/:categoriaId", verificarAdministrador, categoria.actualizar);
router.delete("/categorias/:categoriaId", verificarAdministrador, categoria.eliminar);

// Dietas
router.get("/dietas", dieta.listarTodas);
router.get("/dietas/:dietaId", dieta.obtener);
router.post("/dietas", verificarAdministrador, dieta.crear);
router.put("/dietas/:dietaId", verificarAdministrador, dieta.actualizar);
router.delete("/dietas/:dietaId", verificarAdministrador, dieta.eliminar);

// Origenes
router.get("/origenes", origen.listarTodos);
router.get("/origenes/:origenId", origen.obtener);
router.post("/origenes", verificarAdministrador, origen.crear);
router.put("/origenes/:origenId", verificarAdministrador, origen.actualizar);
router.delete("/origenes/:origenId", verificarAdministrador, origen.eliminar);

// Ingredientes
router.get("/ingredientes", ingrediente.listarTodos);
router.get("/ingredientes/:ingredienteId", ingrediente.obtener);
router.post("/ingredientes", verificarAdministrador, ingrediente.crear);
router.put("/ingredientes/:ingredienteId", verificarAdministrador, ingrediente.actualizar);
router.delete("/ingredientes/:ingredienteId", verificarAdministrador, ingrediente.eliminar);

// Comentarios
router.get("/comentarios", verificarUsuario, comentario.listarTodos);
router.get("/recetas/:recetaId/comentarios", verificarUsuario, comentario.listarTodos);
router.get("/comentarios/:comentarioId", verificarUsuario, comentario.obtener);
router.get("/recetas/:recetaId/comentarios/:comentarioId", verificarUsuario, comentario.obtener);
router.post("/comentarios", verificarUsuario, comentario.crear);
router.post("/recetas/:recetaId/comentarios", verificarUsuario, comentario.crear);
router.put("/comentarios/:comentarioId", verificarUsuario, comentario.actualizar);
router.put("/recetas/:recetaId/comentarios/:comentarioId", verificarUsuario, comentario.actualizar);
router.delete("/comentarios/:comentarioId", verificarUsuario, comentario.eliminar);
router.delete("/recetas/:recetaId/comentarios/:comentarioId", verificarUsuario, comentario.eliminar);

module.exports = router;