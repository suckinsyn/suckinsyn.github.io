document.addEventListener("DOMContentLoaded", function() {
    function drawLineBetweenCells(cell1, cell2) {
        const svg = document.getElementById('fullsvg');
        const rect1 = cell1.getBoundingClientRect();
        const rect2 = cell2.getBoundingClientRect();

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', rect1.left + rect1.width / 2);
        line.setAttribute('y1', rect1.top + rect1.height / 2);
        line.setAttribute('x2', rect2.left + rect2.width / 2);
        line.setAttribute('y2', rect2.top + rect2.height / 2);
        line.setAttribute('style', 'stroke: black; stroke-width: 2;');

        svg.appendChild(line);
    }

    function findAdjacentCells() {
        const table = document.getElementById('csv-table');
        if (!table) {
            console.error('Table not found');
            return;
        }

        const rows = table.getElementsByTagName('tr');
        const rowCount = rows.length;
        const colCount = rows[0].getElementsByTagName('td').length;

        function isValid(x, y) {
            return x >= 0 && x < rowCount && y >= 0 && y < colCount;
        }

        function checkAndDraw(x, y) {
            const cell = rows[x].getElementsByTagName('td')[y];
            if (cell && cell.textContent.trim().startsWith('o')) {
                console.log(`Cell found at (${x}, ${y}) with value: "${cell.textContent.trim()}"`);

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
                            drawLineBetweenCells(cell, adjacentCell);
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
        const tableContainer = document.getElementById('table-container');
        if (tableContainer && tableContainer.classList.contains('visible')) {
            findAdjacentCells();
        } else {
            console.error('Table container is not visible or not found');
        }
    });
});
