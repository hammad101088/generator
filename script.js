// Function to add a new row to the table
function addRow() {
    const tableBody = document.getElementById("table-body");
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
        <td><input type="text" class="listActual" placeholder="Enter listActual JSON Path" /></td>
        <td><input type="text" class="listExpected" placeholder="Enter listExpected JSON Path" /></td>
        <td><button class="remove-btn" onclick="removeRow(this)">&#10006;</button></td>
    `;
    tableBody.appendChild(newRow);
}

// Function to remove a row from the table
function removeRow(button) {
    const row = button.parentElement.parentElement;
    row.remove();
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

// Handle JSON paths with filters like [*].productTerm[?(@.name='mobile')].id
function mapFilteredJsonPath(jsonPath) {
    // Split the path into segments
    const [beforeFilter, afterFilter] = jsonPath.split("[?(");
    
    if (!afterFilter) return "Invalid filter format";
    
    // Get base path without [*]
    const basePath = beforeFilter.replace("[*].", "");
    
    // Extract filter condition and final path
    const filterPart = afterFilter.split(")].");
    if (filterPart.length !== 2) return "Invalid filter format";
    
    const filterCondition = filterPart[0];
    const finalField = filterPart[1];
    
    // Parse filter condition
    const cleanedFilterCondition = filterCondition.replace(/['"]/g, '').split("=");
    if (cleanedFilterCondition.length !== 2) return "Invalid filter condition";
    
    const filterField = cleanedFilterCondition[0].trim().replace(/^@./, '');
    const filterValue = cleanedFilterCondition[1].trim();
    
    // Construct the paths
    const mainPath = `${basePath}.${finalField}`;
    const filterPath = `${basePath}.${filterField}`;
    
    return `extractFilteredList(
        extractList(responseList, "${filterPath}"),
        extractList(responseList, "${mainPath}"),
        "${filterValue}")`;
}

// Handle simple JSON paths like [*].billingAccount.id
function mapSimpleJsonPath(jsonPath) {
    const path = jsonPath.replace("[*].", "");
    return `extractList(responseList, "${path}")`;
}

// Extract the final field from the JSON path
function getFinalField(jsonPath) {
    if (jsonPath.includes("[?(")) {
        // For filtered paths, get the field after the filter
        const parts = jsonPath.split(")].");
        return parts[parts.length - 1];
    } else {
        // For simple paths
        const fields = jsonPath.replace("[*].", "").split(".");
        return fields[fields.length - 1];
    }
}

// Rest of the functions remain the same...

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

            const javaMethod = `verifyMandatoryListEquals(
    ${actualMethod},
    ${expectedMethod},
    "${actualField}");`;

            allMethods += javaMethod + "\n\n";
        }
    });

    const outputTextArea = document.getElementById("outputText");
    outputTextArea.value = allMethods;
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
    
    // Add show class for animation
    toast.classList.add("show");
    
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.remove();
        }, 300); // Wait for fade out animation
    }, 3000);
}

// Function to copy all content to clipboard
function copyToClipboard() {
    const outputText = document.getElementById("outputText");
    const text = outputText.value;

    if (!text) {
        showToast("No content to copy!");
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => {
            showToast("Copied to clipboard!");
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            showToast("Failed to copy!");
        });
}

// Add example rows function
function addExampleRows() {
    const examples = [
        {
            actual: "[*].orders.items[?(@.type='premium')].price",
            expected: "[*].expectedPricing.premiumItems.value"
        },
        {
            actual: "[*].billingAccount.id",
            expected: "[*].accountDetails.id"
        }
    ];

    examples.forEach(example => {
        const tableBody = document.getElementById("table-body");
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td><input type="text" class="listActual" value="${example.actual}" /></td>
            <td><input type="text" class="listExpected" value="${example.expected}" /></td>
            <td><button class="remove-btn" onclick="removeRow(this)">&#10006;</button></td>
        `;
        tableBody.appendChild(newRow);
    });
}

// Clear all rows function
function clearAllRows() {
    const tableBody = document.getElementById("table-body");
    tableBody.innerHTML = '';
    addRow(); // Add one empty row
    
    // Clear output
    const outputText = document.getElementById("outputText");
    outputText.value = '';
}

// Initialize the page with example data
document.addEventListener('DOMContentLoaded', function() {
    clearAllRows(); // Start with one empty row
});