function initZoomPan(svg) {
    const container = document.getElementById('container');
    let isPanning = false;
    let startX, startY;
    let currentScale = 0.4; // Start with 0.4 scale
    let currentTranslateX = 0, currentTranslateY = 0;

    function centerAndScale() {
        const containerRect = container.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        // Center the SVG in the container initially
        currentTranslateX = (containerRect.width - svgRect.width * currentScale) / 2;
        currentTranslateY = (containerRect.height - svgRect.height * currentScale) / 2;

        updateTransform();
    }

    function updateTransform() {
        svg.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${currentScale})`;
    }

    svg.addEventListener('wheel', (event) => {
        event.preventDefault();
        const scaleFactor = 1.1;
        const rect = svg.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const offsetX = event.clientX - rect.left - centerX;
        const offsetY = event.clientY - rect.top - centerY;
    
        const scaleChange = event.deltaY < 0 ? scaleFactor : 1 / scaleFactor;
        const newScale = currentScale * scaleChange;
        
        // Clamp the newScale between 0.4 and 2.5
        if (newScale < 0.4) {
            currentScale = 0.4;
            return;
        } else if (newScale > 2.5) {
            currentScale = 2.5;
            // Do not update translation when clamped to maximum scale
            return;
        } else {
            currentScale = newScale;
        }
    
        // Adjust translation based on the new scale
        currentTranslateX = (currentTranslateX - offsetX) * (currentScale / (newScale || currentScale)) + offsetX;
        currentTranslateY = (currentTranslateY - offsetY) * (currentScale / (newScale || currentScale)) + offsetY;
        
        console.log(currentScale);
        updateTransform();
    });
    
    
    

    svg.addEventListener('pointerdown', (event) => {
        isPanning = true;
        startX = event.clientX;
        startY = event.clientY;
    });

    svg.addEventListener('pointermove', (event) => {
        if (isPanning) {
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            currentTranslateX += dx;
            currentTranslateY += dy;
            updateTransform();
            startX = event.clientX;
            startY = event.clientY;
        }
    });

    svg.addEventListener('pointerup', () => {
        isPanning = false;
    });

    svg.addEventListener('pointercancel', () => {
        isPanning = false;
    });

    centerAndScale();
}
