const http = require('http');
const cors = require('cors');
const express = require('express')
const multer  = require('multer');

const app = express();

app.use(express.urlencoded());
app.use(express.json());
app.use(express.text());
app.use(cors());
const storage = multer.memoryStorage();
const upload = multer({ storage });

const address = "127.0.0.1";
const port = 8001;

const minio_add = "http://minioclient";
const minio_port = "8002";

var files = [];

app.get('/', (req, res) => {
    res.send(JSON.stringify(files));
})

app.post('/upload', upload.single('file'), async(req, res, next) => {  
    var newFile = req.file;
    //check if filename already exists
    var check = checkFileName(newFile.originalname);
    if (check) {
        res.status(400);
        return res.send("File with same name already exists. Please rename the file you want to upload.");
    }
    //get presigned url to upload file  
    try {
        const urlResponse = await fetch(`${minio_add}:${minio_port}/upload?name=${newFile.originalname}`)
        if (urlResponse.ok) {
            var uploadURL = await urlResponse.text();
            //send request to minio server to upload file using presigned url
            try {
                const response = await fetch(uploadURL, {
                    method: "PUT",
                    mode: "cors",
                    body: newFile.buffer
                });
                if (response.ok) {
                    var newFileObj = {};
                    newFileObj.name = newFile.originalname;
                    newFileObj.type = newFile.mimetype;
                    newFileObj.size = newFile.size;
                    newFileObj.lastModified = req.body.lastModified;
                    files.push(newFileObj);
                }
            } catch (err) {
                console.log(err);
            }
        }
        res.status(urlResponse.status);
        res.end();
    } catch (err) {
        console.log(err);
    };
});

app.post('/remove', async(req, res) => {
    var fileName = req.body;
    //check if file existss in object store
    var check = checkFileName(fileName);
    if (!check) {
        res.status(400);
        return res.send("File does not exist in object store.");
    }
    try {
        //send request to minio server to remove file
        const response = await fetch(`${minio_add}:${minio_port}/remove`, {
            method: "POST",
            body: req.body
        });
        res.status(response.status);
        for (i in files) {
            if (files[i].name === fileName) {
                files.splice(i, 1);
            }
        }  
    } catch(err) {
        console.log(err);
    } finally {
        res.end();
    }
});

app.post('/download', async(req, res) => {
    var fileName = req.body;
    //check if file existss in object store
    var check = checkFileName(fileName);
    if (!check) {
        res.status(400);
        return res.send("File does not exist in object store.");
    }
    try {
        //send request to minio server to provide download link
        const response = await fetch(`${minio_add}:${minio_port}/download`, {
            method: "POST",
            body: fileName
        })
        res.status(response.status);
        var downloadURL = await response.text()
        res.send(downloadURL);
    } catch(err) {
        console.log(err);
    } finally {
        res.end();
    };
})

function checkFileName(fileName) {
    for (i in files) {
        if (files[i].name === fileName) {
            return true;
        }
    }  
    return false;
}

function checkFileName(fileName) {
    for (i in files) {
        if (files[i].name === fileName) {
            return true;
        }
    }  
    return false;
}

app.listen(port, (err) => {
    if (err) return console.log(err);
    console.log("Server running at http://" + address + ":" + port + "/");
});