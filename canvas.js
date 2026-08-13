canvas = null
context = null
screenWidth = 1
screenHeight = 1
var textHeight = 10
var primaryMouseBtnDown = false
var mouseClickTime = Date.now()
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
    canvas.addEventListener("click", (event) => { if (250 + mouseClickTime > Date.now()) clickedOnPage(event)})
    canvas.addEventListener("mousedown", (event)=>{ 
        if (event.button == 0)
        {
            primaryMouseBtnDown=true; 
            mouseClickTime = Date.now()
        } 
    })
    canvas.addEventListener("mouseup", (event)=>{ if (event.button == 0) primaryMouseBtnDown=false })
    canvas.addEventListener("mousemove", mouseMoved);
    window.addEventListener("keydown", keyboardDown)
    window.addEventListener("keyup", keyboardUp)
    window.addEventListener("resize", windowResized);
    document.addEventListener('contextmenu', event => event.preventDefault());

    //setInterval(tempFunc, 30)
}

function tempFunc()
{
    draw()
}

function mouseMoved(event) 
{
    MousePosition.x = event.layerX
    MousePosition.y = event.layerY
    if (holdingUIElementV2 != null && primaryMouseBtnDown)
    {
        holdingUIElementV2.tryScroll({x: (MousePosition.x / screenWidth - holdingUIElementV2.x) / holdingUIElementV2.w, y: (MousePosition.y / screenHeight - holdingUIElementV2.y) / holdingUIElementV2.h})
    } else holdingUIElementV2 = null
    // check ui for hover
    const prevHoveringElement = hoveringUIElement
    const newHoveringUIElement = getUIElementAt(MousePosition)
    hoveringUIElement = newHoveringUIElement?.element
    if (hoveringUIElement != prevHoveringElement)
        if (prevHoveringElement != null && prevHoveringElement.endHover != null)
            prevHoveringElement.endHover()
    
    if (hoveringUIElement == null)
        return

    var mp = {x: newHoveringUIElement.scaledX, y: newHoveringUIElement.scaledY}
    if (hoveringUIElement.onHover != null)
        hoveringUIElement.onHover(mp)
    if (primaryMouseBtnDown && hoveringUIElement.canScroll(mp))
    {
        holdingUIElementV2 = hoveringUIElement
        holdingUIElementV2.tryScroll(mp)
    }
}

function setTextSize(textSize)
{
    context.font = textSize + "px serif"
}

function resetTextSize()
{
    setTextSize(textHeight)
}

function windowResized(event)
{
    screenWidth = window.innerWidth
    screenHeight = window.innerHeight 
    canvas.width = screenWidth
    canvas.height = screenHeight
    textHeight = screenHeight / 50
    if (textHeight < 10) textHeight = 10 // min size
    resetTextSize()
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