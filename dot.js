document.addEventListener("DOMContentLoaded", function() {
    function createLine(x1, y1, x2, y2) {
        const line = document.createElement('div');
        line.style.position = 'absolute';
        line.style.backgroundColor = 'red'; // Set line color to red
        line.style.height = '8px'; // Set line thickness to 8px
        line.style.width = `${Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)}px`;
        line.style.transformOrigin = '0 0';
        line.style.transform = `rotate(${Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI}deg)`;
        line.style.left = `${Math.min(x1, x2)}px`;
        line.style.top = `${Math.min(y1, y2)}px`;
        document.getElementById('table-container').appendChild(line); // Append to the table container
    }

    function findAdjacentCells() {
        const table = document.getElementById('csv-table');
        if (!table) {
            console.error('Table not found');
            return;
        }

        const rows = table.getElementsByTagName('tr');
        if (rows.length === 0) {
            console.error('No rows found in table');
            return;
        }

        const rowCount = rows.length;
        const colCount = rows[0].getElementsByTagName('td').length;

        function isValid(x, y) {
            return x >= 0 && x < rowCount && y >= 0 && y < colCount;
        }

        function getCellCoords(cell) {
            const rect = cell.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        }

        function checkAndDraw(x, y) {
            const cell = rows[x].getElementsByTagName('td')[y];
            if (cell && cell.textContent.trim().startsWith('o')) {
                console.log(`Cell found at (${x}, ${y}) with value: "${cell.textContent.trim()}"`);

                const { x: x1, y: y1 } = getCellCoords(cell);

                const directions = [
                    { dx: -1, dy: 0 }, // up
                    { dx: 1, dy: 0 }, // down
                    { dx: 0, dy: -1 }, // left
                    { dx: 0, dy: 1 }  // right
                ];
                for (const dir of directions) {
                    const newX = x + dir.dx;
                    const newY = y + dir.dy;
                    if (isValid(newX, newY)) {
                        const adjacentCell = rows[newX].getElementsByTagName('td')[newY];
                        if (adjacentCell && adjacentCell.textContent.trim().startsWith('o')) {
                            const { x: x2, y: y2 } = getCellCoords(adjacentCell);
                            createLine(x1, y1, x2, y2);
                        }
                    }
                }
            }
        }

        for (let i = 0; i < rowCount; i++) {
            for (let j = 0; j < colCount; j++) {
                checkAndDraw(i, j);
            }
        }
    }

    // Listen for the custom event
    document.addEventListener('tableRendered', function() {
        console.log('Custom event "tableRendered" received.');
        const tableContainer = document.getElementById('table-container');
        if (tableContainer && tableContainer.classList.contains('visible')) {
            findAdjacentCells();
        } else {
            console.error('Table container is not visible or not found');
        }
    });
});
