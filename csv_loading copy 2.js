let missingMappings = {};

function loadMissingMappings() {
    return fetch('/data/missing.json')
        .then(response => response.json())
        .then(data => {
            // Append '.png' to each key in the missingMappings object
            missingMappings = Object.fromEntries(
                Object.entries(data).map(([key, value]) => [key, `${value}.png`])
            );
        })
        .catch(error => console.error('Failed to load missing.json:', error));
}

async function loadManualOverrides() {
    const response = await fetch('data/csv/manual_overrides.json');
    const data = await response.json();
    return data;
}

function drawConnections(rows, cellSize) {
    const connectorValues = ['o', 'p', 'h', 'v', 'k', 'u', 'j', 'm', 'n', 'l', 'i'];
    const directions = [
        { dx: 0, dy: -1 },  // up
        { dx: 1, dy: 0 },   // right
        { dx: 0, dy: 1 },   // down
        { dx: -1, dy: 0 },  // left
        { dx: 1, dy: -1 },  // diagonal up-right
        { dx: 1, dy: 1 },   // diagonal down-right
        { dx: -1, dy: 1 },  // diagonal down-left
        { dx: -1, dy: -1 }  // diagonal up-left
    ];

    const svg = document.getElementById('svgContainer');
    const lineContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const maxScanRange = 1; // Limit the range to scan
    const distanceThreshold = 2; // Maximum allowed distance to create a connection
    lineContainer.setAttribute('id', 'lineContainer');
    svg.appendChild(lineContainer);

    // Load manual overrides
    loadManualOverrides().then(manualOverrides => {
        function isManualOverride(x1, y1, x2, y2) {
            return manualOverrides.some(override => (
                (override.x1 === x1 && override.y1 === y1 && override.x2 === x2 && override.y2 === y2) ||
                (override.x1 === x2 && override.y1 === y2 && override.x2 === x1 && override.y2 === y1)
            ));
        }

        rows.forEach((row, y) => {
            row.forEach((cell, x) => {
                const trimmedCell = cell.trim();
                if (connectorValues.includes(trimmedCell)) {
                    let hasConnection = false;
                    let connections = [];

                    directions.forEach(({ dx, dy }) => {
                        let nx = x + dx;
                        let ny = y + dy;
                        let steps = 0;

                        while (steps < maxScanRange && nx >= 0 && ny >= 0 && ny < rows.length && nx < rows[ny].length) {
                            const neighborCell = rows[ny][nx].trim();

                            if (neighborCell === trimmedCell) {
                                nx += dx;
                                ny += dy;
                                steps++;
                                continue;
                            }

                            if (!connectorValues.includes(neighborCell) && neighborCell) {
                                const distance = Math.sqrt((nx - x) ** 2 + (ny - y) ** 2);
                                if (distance <= distanceThreshold) {
                                    if (!isManualOverride(x, y, nx, ny)) {
                                        drawLine(lineContainer, x, y, nx, ny, cellSize);
                                        connections.push({ x: nx, y: ny });
                                        hasConnection = true;
                                    }
                                }
                            }
                            break;
                        }
                    });

                    if (!hasConnection) {
                        directions.forEach(({ dx, dy }) => {
                            let nx = x + dx;
                            let ny = y + dy;
                            let steps = 0;

                            while (steps < maxScanRange && nx >= 0 && ny >= 0 && ny < rows.length && nx < rows[ny].length) {
                                const neighborCell = rows[ny][nx].trim();

                                if (neighborCell === trimmedCell) {
                                    const distance = Math.sqrt((nx - x) ** 2 + (ny - y) ** 2);
                                    if (distance <= distanceThreshold) {
                                        if (!isManualOverride(x, y, nx, ny)) {
                                            drawLine(lineContainer, x, y, nx, ny, cellSize);
                                        }
                                    }
                                    break;
                                }
                                nx += dx;
                                ny += dy;
                                steps++;
                            }
                        });
                    }

                    // Additional rule: Check if the node has only one connection to a data node
                    if (connections.length === 1) {
                        const singleConnection = connections[0];
                        const cx = singleConnection.x;
                        const cy = singleConnection.y;

                        directions.forEach(({ dx, dy }) => {
                            let nx = x + dx;
                            let ny = y + dy;
                            let steps = 0;

                            while (steps < maxScanRange && nx >= 0 && ny >= 0 && ny < rows.length && nx < rows[ny].length) {
                                const neighborCell = rows[ny][nx].trim();

                                if (connectorValues.includes(neighborCell) && neighborCell === trimmedCell) {
                                    const distance = Math.sqrt((nx - x) ** 2 + (ny - y) ** 2);
                                    if (distance <= distanceThreshold) {
                                        if (!isManualOverride(x, y, nx, ny)) {
                                            drawLine(lineContainer, x, y, nx, ny, cellSize);
                                        }
                                        break;
                                    }
                                }
                                nx += dx;
                                ny += dy;
                                steps++;
                            }
                        });
                    }
                }
            });
        });
    }).catch(error => {
        console.error('Error loading manual overrides:', error);
    });
}

/*
function drawLine(container, x1, y1, x2, y2, size) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', (x1 + 0.5) * size);
    line.setAttribute('y1', (y1 + 0.5) * size);
    line.setAttribute('x2', (x2 + 0.5) * size);
    line.setAttribute('y2', (y2 + 0.5) * size);
    //line.setAttribute('stroke', '#fab700');
    //line.setAttribute('stroke-width', 2);
    container.appendChild(line);
    console.log(`Connected (${x1}, ${y1}) to (${x2}, ${y2}) with a line`);
}*/

function drawLine(container, x1, y1, x2, y2, size, cellValue) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', (x1 + 0.5) * size);
    line.setAttribute('y1', (y1 + 0.5) * size);
    line.setAttribute('x2', (x2 + 0.5) * size);
    line.setAttribute('y2', (y2 + 0.5) * size);
    line.classList.add('line-off');  // Start with the "off" class
    line.dataset.cellValue = cellValue;  // Store the cell value for later use
    container.appendChild(line);
}

/*----------------*/
function updateOutgoingLines(x, y, newClass, rows) {  // Added `rows` as a parameter
    const directions = [
        { dx: 0, dy: -1 },  // up
        { dx: 1, dy: 0 },   // right
        { dx: 0, dy: 1 },   // down
        { dx: -1, dy: 0 },  // left
        { dx: 1, dy: -1 },  // diagonal up-right
        { dx: 1, dy: 1 },   // diagonal down-right
        { dx: -1, dy: 1 },  // diagonal down-left
        { dx: -1, dy: -1 }  // diagonal up-left
    ];

    directions.forEach(({ dx, dy }) => {
        let nx = x + dx;
        let ny = y + dy;

        while (nx >= 0 && ny >= 0 && ny < rows.length && nx < rows[ny].length) {
            const neighborKey = `${nx},${ny}`;
            const neighborCell = rows[ny][nx].trim();

            if (cellStates[neighborKey] === 'off' && !connectorValues.includes(neighborCell)) {
                break;  // Stop if we meet a non-connector node that is off
            }

            // Update the class of the line
            const lines = document.querySelectorAll('line');
            lines.forEach(line => {
                if (line.dataset.cellValue === neighborCell) {
                    line.classList.remove('line-off');
                    line.classList.add(newClass);  // Update the line class to "line-on"
                }
            });

            nx += dx;
            ny += dy;
        }
    });
}

/*-------------*/


function loadCsvList() {
    fetch('/data/csv/')
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(data, 'text/html');
            const files = [...htmlDoc.querySelectorAll('a')]
                .map(a => a.href.split('/').pop())
                .filter(file => file.endsWith('.csv'));
            populateDropdown(files);
        })
        .catch(error => console.error('Error loading CSV file list:', error));
}

function populateDropdown(files) {
    const dropdown = document.getElementById('csvFileDropdown');
    files.forEach(file => {
        const option = document.createElement('option');
        option.value = file;
        option.textContent = file;
        dropdown.appendChild(option);
    });
}

function loadSelectedCsv() {
    const selectedFile = document.getElementById('csvFileDropdown').value;
    if (selectedFile) {
        const filePath = `/data/csv/${selectedFile}`;
        fetch(filePath)
            .then(response => response.text())
            .then(data => parseCSV(data, selectedFile))
            .catch(error => console.error('Error loading CSV file:', error));
    }
}

function parseCSV(data, file) {
    const rows = data.split('\n').map(row => row.split(','));
    const svg = document.getElementById('svgContainer');
    const cellSize = 16;
    svg.innerHTML = ''; // Clear previous SVG content

    const svgWidth = rows[0].length * cellSize;
    const svgHeight = rows.length * cellSize;
    svg.setAttribute('width', svgWidth);
    svg.setAttribute('height', svgHeight);
    console.log(`SVG Size: ${svgWidth}x${svgHeight}`);

    rows.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell.trim() !== '') {
                //loadImage(cell.trim(), x, y, cellSize);
                loadImage(cell.trim(), x, y, cellSize, file, rows);
            }
        });
    });

    drawConnections(rows, cellSize);
    // Initialize panning and zooming
    initZoomPan(svg);
}
let cellStates = {};

function loadImage(cell, x, y, size, rows) {
    // Determine the base name and image URL
    const baseName = cell.endsWith('_big') ? cell.slice(0, -4) : cell;
    const imageUrl = `data/icons/${baseName}.png`;
    const image = new Image();
    image.src = imageUrl;

    // Handle image load
    image.onload = () => {
        const svgImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        svgImage.setAttribute('x', x * size);
        svgImage.setAttribute('y', y * size);
        svgImage.setAttribute('width', size);
        svgImage.setAttribute('height', size);
        svgImage.setAttribute('href', image.src);
        svgImage.classList.add('cell');
        const cellKey = `${x},${y}`;

        // Set the initial state of the cell to 'off'
        cellStates[cellKey] = 'off';
        svgImage.addEventListener('click', () => {
            console.log(`Cell (${x}, ${y})\nValue: ${cell}`);
                const cellKey = `${x},${y}`;
                const currentState = cellStates[cellKey];
    
                // Debug check: Log the current state before changing it
                console.log(`Debug: Current state of cell (${x}, ${y}) is '${currentState}'`);
    
                if (currentState === 'off') {
                    cellStates[cellKey] = 'on';  // Change the state to "on"
                    console.log(`Cell (${x}, ${y}) is now ON`);
    
                    // Update the class of outgoing lines to "line-on"
                    updateOutgoingLines(x, y, 'line-on', rows);
                }
        });
        document.getElementById('svgContainer').appendChild(svgImage);
        console.log(`Added image: ${image.src} at (${x * size}, ${y * size})`);

        // If the cell name ends with '_big', render the border icon on top
        if (cell.endsWith('_big')) {
            renderAdditionalIcon(x, y, size);
        }
/* ------------------ 
        svgImage.addEventListener('click', () => {
            const cellKey = `${x},${y}`;
            const currentState = cellStates[cellKey];
    
            if (currentState === 'off') {
                cellStates[cellKey] = 'on';  // Change the state to "on"
                console.log(`Cell (${x}, ${y}) is now ON`);
    
                // Update the class of outgoing lines to "line-on"
                updateOutgoingLines(x, y, 'line-on');
            }
        });
         ------------------ */
    };

    // Handle image error
    image.onerror = () => {
        // Check for missing mappings
        const missingImage = missingMappings[cell] || `${baseName}.png`;
        const missingImageUrl = `data/icons/${missingImage}`;

        const missingImageObj = new Image();
        missingImageObj.src = missingImageUrl;
        missingImageObj.onload = () => {
            addMissingCell(x, y, size, missingImage, cell);
        };
        missingImageObj.onerror = () => {
            // Check with trimmed name if the original name was not found
            const trimmedImage = missingMappings[baseName] || 'missing.png';
            const trimmedImageUrl = `data/icons/${trimmedImage}`;
            
            addMissingCell(x, y, size, trimmedImage, cell);
        };
    };
}

function renderAdditionalIcon(x, y, size) {
    const iconContainer = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    iconContainer.setAttribute('x', x * size);
    iconContainer.setAttribute('y', y * size);
    iconContainer.setAttribute('width', size);
    iconContainer.setAttribute('height', size);
    iconContainer.setAttribute('href', 'data/icons/borders/special_off.png');
    iconContainer.classList.add('cell', 'special'); // Add 'special' class here
    document.getElementById('svgContainer').appendChild(iconContainer);
    console.log(`Added special icon at (${x * size}, ${y * size})`);
}

function addMissingCell(x, y, size, imageName, originalFileName) {
    const imageUrl = `data/icons/${imageName}`;
    const svgImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    svgImage.setAttribute('x', x * size);
    svgImage.setAttribute('y', y * size);
    svgImage.setAttribute('width', size);
    svgImage.setAttribute('height', size);
    svgImage.setAttribute('href', imageUrl);
    svgImage.classList.add('cell');
    svgImage.addEventListener('click', () => {
        console.log(`Cell (${x}, ${y})\nValue: MISSING (${originalFileName})`);
    });
    document.getElementById('svgContainer').appendChild(svgImage);
    console.log(`Added missing cell for file '${originalFileName}' with image '${imageName}' at (${x * size}, ${y * size})`);
}


// Initialize the application
function initialize() {
    loadMissingMappings().then(() => {
        loadCsvList();
    });
}

// Call initialize to set up everything
initialize();
