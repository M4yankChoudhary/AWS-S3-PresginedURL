import express from "express";
import bodyParser from "body-parser";
import Path from "path";
import http from "http";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { parseUrl } from "@aws-sdk/url-parser";
import { Hash } from "@aws-sdk/hash-node";
import { formatUrl } from "@aws-sdk/util-format-url";
import dotenv from "dotenv";
import path from "path";

const ROOT_DIRECTORY = Path.resolve(); // to get the root

// add env directory
dotenv.config({ path: path.join(ROOT_DIRECTORY, ".env") });

// express
const app = express();
const PORT = process.env.PORT; // Port where our server will run!
app.use(bodyParser.json()); // parse json
const router = express.Router();

// config
const bucket = process.env.bucket;
const region = process.env.region;

const credentials = {
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
};

router.post("/:filename", async (req, res) => {
  try {
    const fileToGet = req.params.filename;
    const s3ObjectUrl = parseUrl(
      `https://${bucket}.s3.${region}.amazonaws.com/${fileToGet}`
    );
    const presigner = new S3RequestPresigner({
      credentials,
      region,
      sha256: Hash.bind(null, "sha256"),
    });
    // Create a GET request from S3 url.
    const url = await presigner.presign(new HttpRequest(s3ObjectUrl));
    console.log("PRESIGNED URL: ", formatUrl(url));
    res.send({ url: formatUrl(url) });
  } catch (e) {
    res.status(400).send(e);
  }
});

app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}/api`);
});
