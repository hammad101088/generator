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

// Handle JSON paths with filters like [*].orders.items[?(@.type='premium')].price
function mapFilteredJsonPath(jsonPath) {
    const basePath = jsonPath.split("[?(")[0];  // Get the part before the filter
    const filterCondition = jsonPath.split("[?(")[1] ? jsonPath.split("[?(")[1].split(")]")[0] : null;
    
    // Remove [*]. and get the full path
    const fullPath = basePath.replace("[*].", "");
    
    // Get the path up to the filtered field
    const pathParts = fullPath.split(".");
    const lastField = pathParts[pathParts.length - 1];
    const basePathWithoutLast = pathParts.slice(0, -1).join(".");
    
    // Process filter condition
    if (filterCondition) {
        const cleanedFilterCondition = filterCondition.replace(/['"]/g, '').split("=");
        const filterField = cleanedFilterCondition[0].trim().replace(/^@./, '');
        const filterValue = cleanedFilterCondition[1].trim();
        
        return `extractFilteredList(
        extractList(responseList, "${basePathWithoutLast}.${lastField}"),
        extractList(responseList, "${basePathWithoutLast}.${filterField}"),
        "${filterValue}")`;
    }
    
    return "Invalid filter condition";
}

// Handle simple JSON paths like [*].billingAccount.id
function mapSimpleJsonPath(jsonPath) {
    const path = jsonPath.replace("[*].", "");
    return `extractList(responseList, "${path}")`;
}

// Extract the final field from the JSON path
function getFinalField(jsonPath) {
    const filteredPath = jsonPath.split("[?(")[0];  // Remove any filter part
    const fields = filteredPath.replace("[*].", "").split(".");
    return fields[fields.length - 1];
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