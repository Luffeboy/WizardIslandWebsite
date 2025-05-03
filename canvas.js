canvas = null
context = null
screenWidth = 1
screenHeight = 1
var textHeight = 10
var MousePosition = {x:0, y:0}

var extraCanvas
var extraContext

function getCanvas()
{
    canvas = document.getElementById("gameFrame")
    context = canvas.getContext("2d")
    extraCanvas = document.createElement("canvas");
    extraContext = extraCanvas.getContext("2d")
    windowResized(null);
    canvas.addEventListener("click", clickedOnPage)
    canvas.addEventListener("mousemove", mouseMoved);
    window.addEventListener("keydown", keyboardDown)
    window.addEventListener("keyup", keyboardUp)
    window.addEventListener("resize", windowResized);
    document.addEventListener('contextmenu', event => event.preventDefault());

}

function mouseMoved(event) 
{
    
    MousePosition.x = event.layerX
    MousePosition.y = event.layerY

    // // check ui for hover
    const prevHoveringElement = hoveringUIElement
    hoveringUIElement = null
    hoveringUIElement = getUIElementAt(MousePosition);

    if (hoveringUIElement != prevHoveringElement)
        if (prevHoveringElement != null && prevHoveringElement.endHover != null)
            prevHoveringElement.endHover()
    

    if (hoveringUIElement != null && hoveringUIElement.onHover != null)
        hoveringUIElement.onHover({x: (MousePosition.x / screenWidth - hoveringUIElement.x) / hoveringUIElement.w, y: (MousePosition.y / screenHeight - hoveringUIElement.y) / hoveringUIElement.h})
}


function windowResized(event)
{
    screenWidth = window.innerWidth
    screenHeight = window.innerHeight 
    canvas.width = screenWidth
    canvas.height = screenHeight
    textHeight = screenHeight / 50
    if (textHeight < 10) textHeight = 10 // min size
    context.font = textHeight + "px serif"
    //extraContext.font = textHeight + "px serif"
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
    context.translate(x, y);
    context.rotate(angle);
    context.drawImage(img, 0, 0, img.width, img.height, -w/2,  -h/2, w, h)
    context.globalCompositeOperation = "multiply";

    context.fillStyle = "rgb("+col+")"
    context.beginPath();
    context.ellipse(0,  0, w, h, 0, 0, 2 * Math.PI)
    context.fill();
    context.imageSmoothingEnabled = true;
    context.restore()
}
/// returns the image created
function drawOnExtraCanvas(w, h, func)
{
    //extraContext.clearRect(0,0,w,h)
    extraCanvas.width = w
    extraCanvas.height = h
    extraContext.font = context.font
    func(extraContext)
    return extraCanvas
}