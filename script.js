// Function to add a new row to the table
function addRow() {
    const tableBody = document.getElementById("table-body");
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
        <td><input type="text" class="listActual" placeholder="Enter listActual JSON Path" /></td>
        <td><input type="text" class="listExpected" placeholder="Enter listExpected JSON Path" /></td>
        <td><button onclick="removeRow(this)">Remove</button></td>
    `;
    tableBody.appendChild(newRow);
}

// Function to remove a row from the table
function removeRow(button) {
    const row = button.parentElement.parentElement;
    row.remove();
}

// Function to generate methods for all input rows
function generateMethods() {
    const listActualPaths = document.querySelectorAll(".listActual");
    const listExpectedPaths = document.querySelectorAll(".listExpected");

    let allMethods = '';

    listActualPaths.forEach((input, index) => {
        const listActual = input.value.trim();
        const listExpected = listExpectedPaths[index].value.trim();

        if (listActual && listExpected) {
            const actualMethod = mapJsonPathToMethod(listActual);
            const expectedMethod = mapJsonPathToMethod(listExpected);
            const actualField = getFinalField(listActual);

            const javaMethod = `
verifyMandatoryListEquals(
    ${actualMethod},
    ${expectedMethod},
    "${actualField}");`;

            allMethods += javaMethod + "\n\n";
        }
    });

    const outputTextArea = document.getElementById("outputText");
    outputTextArea.value = allMethods;
}

// Function to map JSON path to Java method (handle both filtered and simple JSON paths)
function mapJsonPathToMethod(jsonPath) {
    if (jsonPath.includes("[*]") && jsonPath.includes("?")) {
        return mapFilteredJsonPath(jsonPath);
    } else if (jsonPath.includes("[*]")) {
        return mapSimpleJsonPath(jsonPath);
    } else {
        return "Invalid JSON path format";
    }
}

// Handle JSON path with filters like [*].productTerm[?(@.name='mobile')].id
function mapFilteredJsonPath(jsonPath) {
    const basePath = jsonPath.split("[?(")[0];  // Get the part before the filter (base path)
    const filterCondition = jsonPath.split("[?(")[1] ? jsonPath.split("[?(")[1].split(")]")[0] : null;  // Get the filter condition if it exists

    const baseFields = basePath.replace("[*].", "").split(".");  // Split path by dot and remove [*].
    const parentField = baseFields[0] || '';  // First level field
    const childField = baseFields[1] || '';  // Second level field

    if (!parentField) {
        return "Invalid JSON path provided, missing fields.";
    }

    // Process filter condition if it exists
    let filterField = '';
    let filterValue = '';
    if (filterCondition) {
        const cleanedFilterCondition = filterCondition.replace(/['"]/g, '').split("=");  // Clean filter condition
        filterField = cleanedFilterCondition[0].trim().replace(/^@./, '');  // Remove '@.' from the start of the filter field
        filterValue = cleanedFilterCondition[1].trim();  // Extract filter value
    }

    // Generate the method based on the path and filter
    if (!childField && filterCondition) {
        return `extractFilteredList(
            extractList(responseList, "${parentField}", "${filterField}"),
            extractList(responseList, "${parentField}", "id"),
            "${filterValue}")`;
    }

    return `extractFilteredList(
        extractList(responseList, "${parentField}", "${childField}", "${filterField}"),
        extractList(responseList, "${parentField}", "${childField}", "id"),
        "${filterValue}")`;
}

// Handle simple JSON paths like [*].billingAccount.id or [*].productTerm.validFor
function mapSimpleJsonPath(jsonPath) {
    const basePath = jsonPath.replace("[*].", "");
    const fields = basePath.split(".");

    let actualMethod = `extractList(responseList, "${fields[0]}"`;
    for (let i = 1; i < fields.length; i++) {
        actualMethod += `, "${fields[i]}"`;
    }
    actualMethod += ")";
    return actualMethod;
}

// Extract the final field from the JSON path (after the last dot or filter)
function getFinalField(jsonPath) {
    const filteredPath = jsonPath.split("[?(")[0];  // Remove any filter part
    const fields = filteredPath.replace("[*].", "").split(".");
    
    return fields[fields.length - 1];
}

// Function to toggle the output container (collapse/expand)
function toggleOutput() {
    const outputContainer = document.getElementById("output-container");
    outputContainer.classList.toggle("collapsed");
}


// Function to show toast notification
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Function to copy all content to clipboard
function copyToClipboard() {
    const outputText = document.getElementById("outputText");
    const text = outputText.value;

    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = text;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);

    showToast("copied to clipboard!");
}

