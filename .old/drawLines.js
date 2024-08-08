function findCoordinatesInElements(value1, value2) {
    const imgs = document.querySelectorAll('img');
    let img1 = null;
    let img2 = null;

    imgs.forEach((img) => {
        const altText = img.alt.replace(/\s+/g, ' ').trim();

        // Log only elements containing the target values
        if (altText.includes(value1) || altText.includes(value2)) {
            console.log('Filtered Img Alt:', altText);
        }

        if (altText.includes(value1)) {
            img1 = img;
        }
        if (altText.includes(value2)) {
            img2 = img;
        }
    });

    if (img1 && img2) {
        const rect1 = img1.getBoundingClientRect();
        const rect2 = img2.getBoundingClientRect();

        console.log('rect1:', rect1);
        console.log('rect2:', rect2);

        const x1 = rect1.left + rect1.width / 2;
        const y1 = rect1.top + rect1.height / 2;
        const x2 = rect2.left + rect2.width / 2;
        const y2 = rect2.top + rect2.height / 2;

        console.log(`Coordinates of value1: (${x1}, ${y1})`);
        console.log(`Coordinates of value2: (${x2}, ${y2})`);

        drawLineOnCanvas(x1, y1, x2, y2);
    } else {
        if (!img1) console.log(`Value1 (${value1}) not found`);
        if (!img2) console.log(`Value2 (${value2}) not found`);
    }
}





function drawLineOnCanvas(x1, y1, x2, y2) {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    // Resize canvas to cover the whole viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Define a new path
    ctx.beginPath();

    // Set a start-point
    ctx.moveTo(x1, y1);

    // Set an end-point
    ctx.lineTo(x2, y2);

    // Set the stroke color and width
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 8;

    // Stroke it (Do the Drawing)
    ctx.stroke();
}