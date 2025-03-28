canvas = null
context = null
screenWidth = 1
screenHeight = 1
const textHeight = 10
function getCanvas()
{
    canvas = document.getElementById("gameFrame")
    context = canvas.getContext("2d");
    context.font = textHeight + "px serif";
    
    windowResized(null);
    canvas.addEventListener("click", clickedOnPage)
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
    draw()
}