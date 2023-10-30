const Minio = require('minio');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(express.urlencoded());
app.use(express.text());
app.use(cors());

const address = "127.0.0.1";
const port = 8002;


var minioClient = new Minio.Client({
  endPoint: "minioserver",
  port: 9000,
  useSSL: false,
  accessKey: "minioadmin",
  secretKey: "secretpass"
});

const bucketName = "myfiles";

minioClient.bucketExists(bucketName, function (err, exists) {
  if (err) {
    return console.log(err)
  }
  if (!exists) {
    minioClient.makeBucket(bucketName, "us-east-1", function (err) {
      if (err) return console.log(err);
      console.log("Bucket created successfully in 'us-east-1'.");
    });
  }
})

app.get("/upload", (req, res) => {
  console.log("Upload: " + req.query.name);
  minioClient.presignedPutObject(bucketName, req.query.name, function(err, presignedUrl) {
      if (err) throw err;
      res.send(presignedUrl);
  })
});

app.post("/remove", (req, res) => {
  console.log("Remove: " + req.body);
  try {
    minioClient.removeObject(bucketName, req.body);
    res.status(200);
  } catch (err) {
    res.status(500);
  } finally {
    res.end();
  }
});

app.post("/download", (req, res) => {
  console.log("Download: " + req.body);
  minioClient.presignedGetObject(bucketName, req.body, 5 * 60 * 60, function (err, presignedUrl) {
    if (err) return console.log(err)
    console.log("DL URL: " + presignedUrl);
    res.status(200);
    res.send(presignedUrl);
  })
});

//remove bucket when server shuts down
process.on("SIGINT", () => {
  try {
    minioClient.removeBucket(bucketName);
    console.log("Bucket removed successfully.");
  } catch (err) {
    console.log("unable to remove bucket.");
  }
});


app.listen(port, (err) => {
  if (err) return console.log(err);
  console.log("Server running at http://" + address + ":" + port + "/");
});
