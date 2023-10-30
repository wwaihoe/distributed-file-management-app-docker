const applogic_add = "http://127.0.0.1";
const applogic_port = "8001";

window.addEventListener("load", async () => {
    try {
        const response = await fetch(`${applogic_add}:${applogic_port}`)
        if (response.ok) {
            const objects = await response.json();
            for (i in objects) {
                var object = objects[i];
                loadObject(object);
            }
        }
        else {
            alert("Error loading files!");
        }
    } catch (err) {
        console.error(err);
        alert("Error loading files!");
    };
});

function loadObject(obj) {
    var table = document.getElementById("objectTable").getElementsByTagName("tbody")[0];
    var row = table.insertRow(-1);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    var cell5 = row.insertCell(4);
    var cell6 = row.insertCell(5);
    cell1.innerHTML = obj.name;
    cell1.setAttribute("class", "fileName");
    cell2.innerHTML = obj.type; 
    cell2.setAttribute("class", "fileType");
    cell3.innerHTML = obj.size; 
    cell3.setAttribute("class", "fileSize");
    var date = new Date(Number(obj.lastModified));
    cell4.innerHTML = date.toLocaleString();
    cell4.setAttribute("class", "lastModified");
    var downloadButton = 
    `<button class="fileDownloadInput btn btn-outline-success" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
        </svg>
    </button>`;
    var removeButton = 
    `<button class="fileRemoveInput btn btn-outline-danger" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
            <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
        </svg>
     </button>`;
    cell5.innerHTML = downloadButton;
    cell6.innerHTML = removeButton;
}

var fileUploadBtn = document.getElementById("inputGroupFileAddon");
fileUploadBtn.addEventListener("click", uploadFile);

async function uploadFile() {
    var fileInput = document.getElementById("inputGroupFile");
    var fileList = fileInput.files;
    if (fileList.length === 0) {
        alert("No files selected for upload!");
    } else {
        fileUploadBtn.disabled = true;
        fileInput.disabled = true;
        var file = fileList[0];
        console.log("Upload: " + file.name);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("lastModified", file.lastModified);
        try {
            const response = await fetch(`${applogic_add}:${applogic_port}/upload`, {
                method: "POST",
                body: formData
            })
            if (response.ok) {
                var object  = {
                    'name'             : file.name,
                    'type'             : file.type,
                    'size'             : file.size,
                    'lastModified'     : file.lastModified
                };  
                loadObject(object);
            }
            else if (response.status === 400) {
                alert(await response.text());
            }
            else {  
                alert("Failed to upload file!");
            }
        } catch(err) {
            console.log(err);
            alert("Failed to upload file!");
        };
        fileUploadBtn.disabled = false;
        fileInput.disabled = false;
        fileInput.value = "";
    }
}

var objectTable = document.getElementById("objectTable");
objectTable.addEventListener("click", function(e) {
    if (e.target.classList.contains("fileRemoveInput")) {
        var fileName = e.target.parentNode.parentNode.getElementsByClassName("fileName")[0].innerHTML;
        console.log("Remove: " + fileName);
        e.target.disabled = true;
        removeFile(fileName);
        e.target.disabled = false;
    }
    else if (e.target.classList.contains("fileDownloadInput")) {
        var fileName = e.target.parentNode.parentNode.getElementsByClassName("fileName")[0].innerHTML;
        console.log("Download: " + fileName);
        e.target.disabled = true;
        downloadFile(fileName);
        e.target.disabled = false;
    }
});

async function removeFile(fileName) {
    var table = document.getElementById("objectTable");
    try {
        const response = await fetch(`${applogic_add}:${applogic_port}/remove`, {
            method: "POST",
            body: fileName
        })
        if (response.ok) {
            for (var i = 0; i < table.tBodies[0].rows.length; i++) {
                if (table.tBodies[0].rows[i].getElementsByClassName("fileName")[0].innerHTML === fileName) {
                    table.tBodies[0].deleteRow(i);
                } 
            }
        }
        else if (response.status === 400) {
            alert(await response.text());
        }
        else {
            alert("Error: " + response.status);
        }
    } catch(err) {
        console.log(err);
    };
}

async function downloadFile(fileName) {
    try {
        const response = await fetch(`${applogic_add}:${applogic_port}/download`, {
            method: "POST",
            body: fileName
        })
        if (response.ok) {
            var url = await response.text();
            window.open(url, '_blank');
        }
        else {
            alert(await response.text());
        }
    } catch(err) {
        console.log(err);
    };
}