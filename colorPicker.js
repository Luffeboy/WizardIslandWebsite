const colorPickerCanvas = document.createElement("canvas");
var colorPickerImage = null

function drawColorPicker(cx, cy, width, height, ctx) {
    cx = Math.round(cx)
    cy = Math.round(cy)
    width = Math.round(width)
    height = Math.round(height)
    const radius = Math.min(width, height) * 0.5;
    if (colorPickerImage == null || colorPickerImage.width != width || colorPickerImage.height != height)
    {
        const colorPickerCanvasCtx = colorPickerCanvas.getContext("2d");
        colorPickerCanvas.width = width;
        colorPickerCanvas.height = height;
        colorPickerImage = colorPickerCanvasCtx.createImageData(width, height);
        const data = colorPickerImage.data;

        const centerX = width * 0.5
        const centerY = height * 0.5

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {

                const dx = x - centerX
                const dy = y - centerY

                const distance = Math.sqrt(dx * dx + dy * dy)

                const index = (y * width + x) * 4

                if (distance > radius) {
                    data[index + 0] = 0
                    data[index + 1] = 0
                    data[index + 2] = 0
                    data[index + 3] = 0
                    continue;
                }

                const saturation = distance / radius

                let hue = Math.atan2(dy, dx) / (2 * Math.PI)
                if (hue < 0)
                    hue += 1

                const rgb = hsvToRgb(hue, saturation, 1)

                data[index + 0] = rgb.r
                data[index + 1] = rgb.g
                data[index + 2] = rgb.b
                data[index + 3] = 255
            }
        }
        colorPickerCanvasCtx.putImageData(colorPickerImage, 0, 0)
    }

    ctx.drawImage(
        colorPickerCanvas,
        Math.round(cx - width * 0.5),
        Math.round(cy - height * 0.5)
    )
    return { radius: radius, width: width, height: height }
}

// x,y normalized from 0..1
function getColorFromColorPicker(x, y)
{

    const dx = x - 0.5;
    const dy = y - 0.5;

    const radius = Math.sqrt(dx * dx + dy * dy) / 0.5;

    if (radius > 1)
        return null;

    let hue = Math.atan2(dy, dx) / (2 * Math.PI);
    if (hue < 0) hue += 1;

    return hsvToRgb(hue, radius, 1);
}


function hsvToRgb(h, s, v) {

    let r, g, b;

    let i = Math.floor(h * 6);
    let f = h * 6 - i;

    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}