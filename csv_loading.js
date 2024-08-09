let cellStates = {};
let missingMappings = {};
const connectorValues = ['o', 'p', 'h', 'v', 'k', 'u', 'j', 'm', 'n', 'l', 'i'];
//let cellSize = 16; // Define cell size globally if needed

// Load missing image mappings
function loadMissingMappings() {
    return fetch('/data/missing.json')
        .then(response => response.json())
        .then(data => {
            missingMappings = Object.fromEntries(
                Object.entries(data).map(([key, value]) => [key, `${value}.png`])
            );
        })
        .catch(error => console.error('Failed to load missing.json:', error));
}

// Load manual overrides
async function loadManualOverrides() {
    try {
        const response = await fetch('data/csv/manual_overrides.json');
        return await response.json();
    } catch (error) {
        console.error('Failed to load manual overrides:', error);
    }
}

// Draw connections based on cell states
function drawConnections(rows, cellSize) {
    console.log(`Calling drawLine with cellSize=${cellSize}`);
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

        // Clear existing lines before redrawing
        lineContainer.innerHTML = '';
        const cellSize = 16;

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

                        while (steps < 1 && nx >= 0 && ny >= 0 && ny < rows.length && nx < rows[ny].length) {
                            const neighborCell = rows[ny][nx].trim();

                            if (neighborCell === trimmedCell) {
                                nx += dx;
                                ny += dy;
                                steps++;
                                continue;
                            }

                            if (!connectorValues.includes(neighborCell) && neighborCell) {
                                const distance = Math.sqrt((nx - x) ** 2 + (ny - y) ** 2);
                                if (distance <= 2) {
                                    if (!isManualOverride(x, y, nx, ny)) {
                                        drawLine(lineContainer, x, y, nx, ny, cellSize, trimmedCell);
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

                            while (steps < 1 && nx >= 0 && ny >= 0 && ny < rows.length && nx < rows[ny].length) {
                                const neighborCell = rows[ny][nx].trim();

                                if (neighborCell === trimmedCell) {
                                    const distance = Math.sqrt((nx - x) ** 2 + (ny - y) ** 2);
                                    if (distance <= 2) {
                                        if (!isManualOverride(x, y, nx, ny)) {
                                            drawLine(lineContainer, x, y, nx, ny, cellSize, trimmedCell);
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

                            while (steps < 1 && nx >= 0 && ny >= 0 && ny < rows.length && nx < rows[ny].length) {
                                const neighborCell = rows[ny][nx].trim();

                                if (connectorValues.includes(neighborCell) && neighborCell === trimmedCell) {
                                    const distance = Math.sqrt((nx - x) ** 2 + (ny - y) ** 2);
                                    if (distance <= 2) {
                                        if (!isManualOverride(x, y, nx, ny)) {
                                            drawLine(lineContainer, x, y, nx, ny, cellSize, trimmedCell);
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


// Draw a line between two points
function drawLine(container, x1, y1, x2, y2, size, cellValue) {
    if (typeof x1 !== 'number' || isNaN(x1) || 
        typeof y1 !== 'number' || isNaN(y1) || 
        typeof x2 !== 'number' || isNaN(x2) || 
        typeof y2 !== 'number' || isNaN(y2) || 
        typeof size !== 'number' || isNaN(size)) {
        console.error('Invalid values detected:', { x1, y1, x2, y2, size });
        return;
    }
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', (x1 + 0.5) * size);
    line.setAttribute('y1', (y1 + 0.5) * size);
    line.setAttribute('x2', (x2 + 0.5) * size);
    line.setAttribute('y2', (y2 + 0.5) * size);
    line.classList.add('line-off');
    line.dataset.cellValue = cellValue;
    container.appendChild(line);
}

// Update line classes based on cell state
function updateOutgoingLines(x, y, newClass, rows) {
    const directions = [
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
        { dx: 1, dy: -1 }, { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
    ];

    directions.forEach(({ dx, dy }) => {
        let nx = x + dx;
        let ny = y + dy;

        while (nx >= 0 && ny >= 0 && ny < rows.length && nx < rows[ny].length) {
            const neighborKey = `${nx},${ny}`;
            const neighborCell = rows[ny][nx].trim();

            if (cellStates[neighborKey] === 'off' && !connectorValues.includes(neighborCell)) {
                break;
            }

            document.querySelectorAll('line').forEach(line => {
                if (line.dataset.cellValue === neighborCell) {
                    line.classList.remove('line-off');
                    line.classList.add(newClass);
                }
            });

            nx += dx;
            ny += dy;
        }
    });
}

// Handle image loading and clicking
function loadImage(cell, x, y, size, rows) {
    const baseName = cell.endsWith('_big') ? cell.slice(0, -4) : cell;
    const imageUrl = `data/icons/${baseName}.png`;
    const image = new Image();
    image.src = imageUrl;

    image.onload = () => {
        const svgImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        svgImage.setAttribute('x', x * size);
        svgImage.setAttribute('y', y * size);
        svgImage.setAttribute('width', size);
        svgImage.setAttribute('height', size);
        svgImage.setAttribute('href', image.src);
        svgImage.classList.add('cell');
        const cellKey = `${x},${y}`;

        cellStates[cellKey] = 'off';
        svgImage.addEventListener('click', () => {
            const currentState = cellStates[cellKey];
            if (currentState === 'off') {
                cellStates[cellKey] = 'on';
                updateOutgoingLines(x, y, 'line-on', rows);
            }
        });

        document.getElementById('svgContainer').appendChild(svgImage);

        if (cell.endsWith('_big')) {
            renderAdditionalIcon(x, y, size);
        }
    };

    image.onerror = () => {
        const missingImage = missingMappings[cell] || `${baseName}.png`;
        const missingImageUrl = `data/icons/${missingImage}`;
        const missingImageObj = new Image();
        missingImageObj.src = missingImageUrl;
        missingImageObj.onload = () => {
            addMissingCell(x, y, size, missingImage, cell);
        };
        missingImageObj.onerror = () => {
            const trimmedImage = missingMappings[baseName] || 'missing.png';
            const trimmedImageUrl = `data/icons/${trimmedImage}`;
            addMissingCell(x, y, size, trimmedImage, cell);
        };
    };
}

// Add a missing cell image
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
}

// Render additional icon for special cells
function renderAdditionalIcon(x, y, size) {
    const iconContainer = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    iconContainer.setAttribute('x', x * size);
    iconContainer.setAttribute('y', y * size);
    iconContainer.setAttribute('width', size);
    iconContainer.setAttribute('height', size);
    iconContainer.setAttribute('href', 'data/icons/borders/special_off.png');
    iconContainer.classList.add('cell', 'special');
    document.getElementById('svgContainer').appendChild(iconContainer);
}

// Load CSV files and populate dropdown
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

// Populate CSV file dropdown
function populateDropdown(files) {
    const dropdown = document.getElementById('csvFileDropdown');
    files.forEach(file => {
        const option = document.createElement('option');
        option.value = file;
        option.textContent = file;
        dropdown.appendChild(option);
    });
}

// Load selected CSV file
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

// Parse CSV data and draw images and connections
function parseCSV(data, file) {
    const cellSize = 16;
    const rows = data.split('\n').map(row => row.split(','));
    const svg = document.getElementById('svgContainer');
    svg.innerHTML = ''; // Clear previous SVG content

    const svgWidth = rows[0].length * cellSize;
    const svgHeight = rows.length * cellSize;
    svg.setAttribute('width', svgWidth);
    svg.setAttribute('height', svgHeight);
    console.log(`SVG Size: ${svgWidth}x${svgHeight}`);

    rows.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell.trim() !== '') {
                loadImage(cell.trim(), x, y, cellSize, rows);
            }
        });
    });

    drawConnections(rows);
    initZoomPan(svg); // Initialize panning and zooming
}

// Initialize the application
function initialize() {
    loadMissingMappings().then(() => {
        loadCsvList();
    });
}

// Call initialize to set up everything
initialize();
