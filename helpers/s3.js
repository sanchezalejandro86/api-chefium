require("dotenv").config();

const Hashids = require("hashids/cjs");
const aws = require("aws-sdk");

const hashids = new Hashids(process.env.HASHIDS_SECRET, 10);

exports.s3Upload = (base64Image, nombre) => {
  return new Promise((resolve, reject) => {
    try {
      aws.config.region = "eu-west-1";

      let imageData = base64Image.replace(/^data:image\/\w+;base64,/, "");
      let buff = Buffer.from(imageData, "base64");

      let arregloRuta = nombre.split("/");
      let ultimoIndice = arregloRuta.length - 1;
      let id = parseInt(arregloRuta[ultimoIndice]) || null;
      if (id) {
        arregloRuta[ultimoIndice] = hashids.encode(id);
      }
      let nuevoNombre = arregloRuta.join("/") + new Date().getTime() + ".png";

      const s3 = new aws.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });

      const s3Params = {
        Bucket: process.env.S3_BUCKET,

        Key: nuevoNombre,
        Body: buff,
        ContentType: "image/png",
        ACL: "public-read",
      };

      s3.upload(s3Params, (err, data) => {
        if (err) {
          reject(err);
        }
        if (data) {
          resolve(data.Location);
        } else {
          reject(null);
        }
      });

    } catch (error) {
      reject(error);
    }
  });
};