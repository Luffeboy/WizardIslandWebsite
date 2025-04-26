canvas = null
context = null
screenWidth = 1
screenHeight = 1
const textHeight = 10
var MousePosition = {x:0, y:0}

var extraCanvas
var extraContext

function getCanvas()
{
    canvas = document.getElementById("gameFrame")
    context = canvas.getContext("2d")
    //extraContext = canvas.getContext("2d")
    
    //extraCanvas = document.createElement("canvas")
    //extraContext = extraCanvas.getContext("2d")
    //context = extraCanvas.getContext("2d")

    context.font = textHeight + "px serif"
    //extraContext.font = textHeight + "px serif"

    windowResized(null);
    canvas.addEventListener("click", clickedOnPage)
    canvas.addEventListener("mousemove", (event) => { MousePosition.x = event.layerX; MousePosition.y = event.layerY });
    window.addEventListener("keydown", keyboardDown)
    window.addEventListener("keyup", keyboardUp)
    window.addEventListener("resize", windowResized);
    document.addEventListener('contextmenu', event => event.preventDefault());
}


function windowResized(event)
{
    screenWidth = window.innerWidth
    screenHeight = window.innerHeight 
    canvas.width = screenWidth
    canvas.height = screenHeight

    //extraCanvas.width = screenWidth
    //extraCanvas.height = screenHeight
    draw()
}

function drawPixelatedImage(img, x, y, w, h, angle = 0)
{
    context.save()
    context.imageSmoothingEnabled = false;
    context.translate(x, y);
    context.rotate(angle);
    context.drawImage(img, 0, 0, img.width, img.height, -w/2,  -h/2, w, h)
    context.imageSmoothingEnabled = true;
    context.restore()
}

function drawColorGradedImage(img, x, y, w, h, angle, col)
{
    context.save()
    context.imageSmoothingEnabled = false;
    //context.drawImage(img, x - w/2, y - h/2, w, h);
    context.translate(x, y);
    context.rotate(angle);
    context.drawImage(img, 0, 0, img.width, img.height, -w/2,  -h/2, w, h)
    context.globalCompositeOperation = "multiply";

    context.fillStyle = "rgb("+col+")"
    context.beginPath();
    context.ellipse(0,  0, w, h, 0, 0, 2 * Math.PI)
    context.fill();

    //context.fillStyle = 'rgb('+col+')';
    //context.fillRect(x, y, w, h);
    context.imageSmoothingEnabled = true;
    context.restore()
}

function switchBuffer()
{
    //extraContext.drawImage(extraCanvas, 0, 0)
}