require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const router = require("./router/routes");

const app = express();

String.prototype.toTitleCase = function () {
  return this.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "*");
  next();
});

app.use(morgan("dev"));

app.use(
  bodyParser.json({
    limit: "50mb",
  })
);
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
  })
);

mongoose.connect(
  process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) throw err;

    console.log("👍 Conectado correctamente a la base de datos");
  }
);

app.get("/", (req, res) => {
  res.json({
    funcionando: true,
    estado: "API funcionando correctamente",
  });
});

app.use("/v1", router);
let puerto = process.env.PORT || 3000;
app.listen(puerto, () => {
  console.log("🚀 Escuchando en el puerto puerto", puerto);
});