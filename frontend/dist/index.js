"use strict";
document.getElementById('uploadButton').addEventListener('click', async () => {
    const input = document.getElementById('ifcFile');
    const file = input.files[0];
    if (!file) {
        alert('Please select an IFC file to upload.');
        return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await fetch('http://127.0.0.1:8000/graphdb/api/query_ifc', {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const result = await response.json();
        const bridgeNames = result.bridge_names;
        document.getElementById('bridgeNames').value = bridgeNames;
    }
    catch (error) {
        console.error('Error:', error);
        alert('An error occurred while uploading the IFC file.');
    }
});
