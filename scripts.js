document.addEventListener("DOMContentLoaded", function () {
    const fileSelector = document.getElementById('csv-file');
    const tableContainer = document.getElementById('table-container');
    const table = document.getElementById('csv-table');
    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    const zoomLevelSpan = document.getElementById('zoom-level');
    let zoomLevel = 100;
    const zoomInMax = 100;
    const zoomOutMax = 10;
    const DEBUG_MODE = true; // Set to true to enable debug info, false to disable
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;

    // Load available CSV files
    fetch('data/files.json')
        .then(response => response.json())
        .then(files => {
            files.forEach(file => {
                const option = document.createElement('option');
                option.value = file;
                option.textContent = file;
                fileSelector.appendChild(option);
            });
        })
        .catch(error => console.error("Error fetching file list:", error));

    // Event listener for file selection
    fileSelector.addEventListener('change', function () {
        const selectedFile = this.value;
        if (selectedFile) {
            hideMapInstantly();
            loadCSV(selectedFile);
        }
    });

    function hideMapInstantly() {
        tableContainer.style.transition = 'none';
        tableContainer.style.opacity = '0';
        tableContainer.offsetHeight;
    }

    function showMap() {
        tableContainer.style.transition = 'opacity 1s ease';
        tableContainer.style.opacity = '1';
    }

    function loadCSV(file) {
        const loadingContainer = document.getElementById('loading-container');
        const loadingText = document.getElementById('loading-text');
        const loadingProgress = document.getElementById('loading-progress');
        const mapContainer = document.getElementById('map-container');

        // Reset progress bar width and text
        loadingProgress.style.width = '0%';
        loadingText.textContent = 'Loading... 0%';

        // Hide the map initially
        tableContainer.classList.remove('visible');

        // Show the loading container
        loadingContainer.style.display = 'flex';
        loadingContainer.classList.remove('hidden');

        // Track loading stage
        let loadingStage = 0;

        function updateLoadingText(stage, percentage) {
            const stages = [
                `Loading cells... ${percentage}%`,
                `Loading icons... ${percentage}%`,
                `Loading descriptions... ${percentage}%`,
                `Finalizing... ${percentage}%`
            ];
            loadingText.textContent = stages[stage] || `Loading... ${percentage}%`;
        }

        Promise.all([
            fetch(`data/${file}`).then(response => response.text()),
            fetch('data/en_us.json').then(response => response.json()),
            fetch('data/special_cases.json').then(response => response.json())
        ])
            .then(([csvData, translations, specialCases]) => {
                Papa.parse(csvData, {
                    header: false,
                    complete: function (results) {
                        const rows = results.data;

                        // Clear previous table content
                        const table = document.getElementById('csv-table');
                        table.innerHTML = '';

                        // Create table body
                        const tbody = document.createElement('tbody');

                        // Calculate total number of cells
                        const totalCells = rows.reduce((sum, row) => sum + row.length, 0);
                        let processedCells = 0;

                        // Process cells in batches
                        function processCells(startRowIndex) {
                            const batchSize = 100;
                            let endRowIndex = Math.min(startRowIndex + batchSize, rows.length);
                            let fragment = document.createDocumentFragment();

                            for (let rowIndex = startRowIndex; rowIndex < endRowIndex; rowIndex++) {
                                const row = rows[rowIndex];
                                const tr = document.createElement('tr');

                                row.forEach(cell => {
                                    const td = document.createElement('td');

                                    if (cell && cell !== "O") {
                                        td.classList.add('grey-bg');
                                        const img = document.createElement('img');

                                        const imageFile = specialCases.icons[cell] || `${cell}.png`;
                                        img.src = `data/icons/${imageFile}`;
                                        img.alt = cell;
                                        img.onerror = function () {
                                            this.src = 'data/icons/missing.png';
                                        };
                                        td.appendChild(img);

                                        const key = `mmorpg.stat.${cell}`;
                                        const descriptionKey = `mmorpg.stat_desc.${cell}`;
                                        let name = translations[key] || cell;

                                        let description = translations[descriptionKey];
                                        let debugInfo = '';

                                        if (!description) {
                                            const fallbackKey = specialCases.descriptions[cell];
                                            if (fallbackKey) {
                                                description = translations[fallbackKey] || `No description available${DEBUG_MODE ? ` (Tried fallback key: ${fallbackKey})` : ''}`;
                                                debugInfo = DEBUG_MODE ? ` (Tried fallback key: ${fallbackKey})` : '';
                                            } else {
                                                description = `No description available${DEBUG_MODE ? ` (Tried key: ${descriptionKey})` : ''}`;
                                                debugInfo = DEBUG_MODE ? ` (Tried key: ${descriptionKey})` : '';
                                            }
                                        }

                                        const tooltip = document.createElement('div');
                                        tooltip.className = 'tooltip';
                                        tooltip.textContent = `${name} (${description})${debugInfo}`;
                                        td.appendChild(tooltip);
                                    } else {
                                        td.classList.add('black-bg');
                                    }

                                    tr.appendChild(td);
                                    processedCells++;
                                });

                                fragment.appendChild(tr);
                            }

                            tbody.appendChild(fragment);

                            const progressPercentage = Math.round((processedCells / totalCells) * 100);
                            requestAnimationFrame(() => {
                                loadingProgress.style.width = `${progressPercentage}%`;
                                updateLoadingText(loadingStage, progressPercentage);
                            });

                            if (endRowIndex < rows.length) {
                                setTimeout(() => processCells(endRowIndex), 0);
                            } else {
                                table.appendChild(tbody);
                                loadingStage = 1;

                                setTimeout(() => {
                                    loadingStage = 2;
                                    setTimeout(() => {
                                        loadingStage = 3;
                                        requestAnimationFrame(() => {
                                            loadingProgress.style.width = '100%';
                                            updateLoadingText(loadingStage, 100);
                                        });
                                        setTimeout(() => {
                                            loadingContainer.classList.add('hidden');
                                            setTimeout(() => {
                                                showMap();
                                                tableContainer.classList.add('visible');
                                                zoomLevel = zoomOutMax;
                                                updateZoom();
                                                centerContent();
finalizeTableRendering();
                                            }, 300);
                                        }, 500);
                                    }, 500);
                                }, 500);
                            }
                        }

                        processCells(0);
                    }
                });
            })
            .catch(error => {
                console.error("Error fetching data:", error);
                loadingContainer.classList.add('hidden');
            });
    }

    function centerContent() {
        const tableRect = table.getBoundingClientRect();
        const containerRect = tableContainer.getBoundingClientRect();

        const scrollLeft = (tableRect.width - containerRect.width) / 2;
        const scrollTop = (tableRect.height - containerRect.height) / 2;

        tableContainer.scrollLeft = Math.max(0, scrollLeft);
        tableContainer.scrollTop = Math.max(0, scrollTop);
    }

    zoomInButton.addEventListener('click', () => {
        zoomLevel = Math.min(zoomLevel + 10, zoomInMax);
        updateZoom();
    });

    zoomOutButton.addEventListener('click', () => {
        zoomLevel = Math.max(zoomLevel - 10, zoomOutMax);
        updateZoom();
    });

    function updateZoom() {
        table.style.transform = `scale(${zoomLevel / 100})`;
        table.style.transformOrigin = '0 0';
        zoomLevelSpan.textContent = `${zoomLevel}%`;
        updateTooltipFontSize();
    }

    function updateTooltipFontSize() {
        const tooltips = document.querySelectorAll('.tooltip');
        tooltips.forEach(tooltip => {
            tooltip.style.fontSize = `${14 / (zoomLevel / 100)}px`;
        });
    }

    tableContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX - tableContainer.offsetLeft;
        startY = e.pageY - tableContainer.offsetTop;
        scrollLeft = tableContainer.scrollLeft;
        scrollTop = tableContainer.scrollTop;
    });

    tableContainer.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    tableContainer.addEventListener('mouseup', () => {
        isDragging = false;
    });

    tableContainer.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - tableContainer.offsetLeft;
        const y = e.pageY - tableContainer.offsetTop;
        const walkX = (x - startX) * 1;
        const walkY = (y - startY) * 1;
        tableContainer.scrollLeft = scrollLeft - walkX;
        tableContainer.scrollTop = scrollTop - walkY;
    });

    tableContainer.addEventListener('wheel', (e) => {
        e.preventDefault();

        const rect = tableContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomChange = e.deltaY < 0 ? 10 : -10;
        const newZoomLevel = Math.min(Math.max(zoomLevel + zoomChange, zoomOutMax), zoomInMax);

        if (newZoomLevel !== zoomLevel) {
            const scale = newZoomLevel / 100;

            const currentScale = zoomLevel / 100;
            const newScrollLeft = (tableContainer.scrollLeft + mouseX) * (scale / currentScale) - mouseX;
            const newScrollTop = (tableContainer.scrollTop + mouseY) * (scale / currentScale) - mouseY;

            zoomLevel = newZoomLevel;
            updateZoom();

            tableContainer.scrollLeft = newScrollLeft;
            tableContainer.scrollTop = newScrollTop;
        }
    });

function finalizeTableRendering() {
    // Signal that the table rendering is complete
    const event = new CustomEvent('tableRendered');
    document.dispatchEvent(event);
}
});
