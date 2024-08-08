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
            .then(data => parseCSV(data))
            .catch(error => console.error('Error loading CSV file:', error));
    }
}

function parseCSV(data) {
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
                const imageUrl = `data/icons/${cell.trim()}.png`;
                const image = new Image();
                image.src = imageUrl;
                image.onload = () => {
                    const svgImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                    svgImage.setAttribute('x', x * cellSize);
                    svgImage.setAttribute('y', y * cellSize);
                    svgImage.setAttribute('width', cellSize);
                    svgImage.setAttribute('height', cellSize);
                    svgImage.setAttribute('href', image.src);
                    svgImage.classList.add('cell');
                    svgImage.addEventListener('click', () => {
                        console.log(`Cell (${x}, ${y})\nValue: ${cell}`);
                    });
                    svg.appendChild(svgImage);
                    console.log(`Added image: ${image.src} at (${x * cellSize}, ${y * cellSize})`);
                };
                image.onerror = () => {
                    console.error(`Failed to load image: ${imageUrl}`);
                    addMissingCell(x, y, cellSize, cell.trim());
                };
            }
        });
    });

    // Initialize panning and zooming
    initZoomPan(svg);
}

function addMissingCell(x, y, size, missingFileName) {
    const svgImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    svgImage.setAttribute('x', x * size);
    svgImage.setAttribute('y', y * size);
    svgImage.setAttribute('width', size);
    svgImage.setAttribute('height', size);
    svgImage.setAttribute('href', 'data/icons/missing.png');
    svgImage.classList.add('cell');
    svgImage.addEventListener('click', () => {
        console.log(`Cell (${x}, ${y})\nValue: MISSING (${missingFileName})`);
    });
    document.getElementById('svgContainer').appendChild(svgImage);
    console.log(`Added missing cell for file '${missingFileName}' at (${x * size}, ${y * size})`);
}