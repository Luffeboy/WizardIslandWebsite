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
    //context = canvas.getContext("2d")
    extraContext = canvas.getContext("2d")
    
    extraCanvas = document.createElement("canvas")
    //extraContext = extraCanvas.getContext("2d")
    context = extraCanvas.getContext("2d")

    context.font = textHeight + "px serif"
    extraContext.font = textHeight + "px serif"

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

    extraCanvas.width = screenWidth
    extraCanvas.height = screenHeight
    draw()
}

function drawPixelatedImage(img, x, y, w, h)
{
    context.imageSmoothingEnabled = false;
    context.drawImage(img, 0, 0, img.width, img.height, x,  y, w, h)
    context.imageSmoothingEnabled = true;
}

function switchBuffer()
{
    extraContext.drawImage(extraCanvas, 0, 0)
}