UIOffSet = { x: 0,y: 0 }
AllUI = []
var selectedUIElement = null
class UIButton
{
    constructor(x, y, w, h, text, onClick, backgroundColor, textColor, isInteractable, onKeyPress){
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.text = text
        this.onClick = onClick
        this.backgroundColor = backgroundColor
        this.textColor = textColor
        this.isInteractable = isInteractable
        this.onKeyPress = onKeyPress
    }
}
function clearUIButtons()
{
    AllUI = []
    UIOffSet = { x: 0,y: 0 }
}
function addUI(x, y, w, h, text, onClick = null, backgroundColor = "rgb(0, 0, 0)", textColor = "rgb(255, 255, 255)", isInteractable = false, onKeyPress = null)
{
    if (!Array.isArray(text)) {
        text = [text]
    }
    fn = onClick
    if (fn != null && fn.length == 0)
        fn = (mp) => {onClick()}
    const btn = new UIButton(x, y, w, h, text, fn, backgroundColor, textColor, isInteractable, onKeyPress)
    AllUI.push(btn)
    return btn // if you want to use it for something :)
}

function drawUI()
{
    for (var i = 0; i < AllUI.length; i++)
    {
        const uiElement = AllUI[i];
        const x = uiElement.x + UIOffSet.x
        const y = uiElement.y + UIOffSet.y
        context.fillStyle = uiElement.backgroundColor
        context.fillRect(x * screenWidth, y * screenHeight, uiElement.w * screenWidth, uiElement.h * screenHeight)
        context.fillStyle = uiElement.textColor
        const txtOffset = textHeight * ((uiElement.text.length - 1) / 2)
        for (var j = 0; j < uiElement.text.length; j++) {
            const txt = uiElement.text[j]
            var textSize = context.measureText(txt)
            context.fillText(txt,
                (x + uiElement.w / 2) * screenWidth - textSize.width / 2,
                (y + uiElement.h / 2) * screenHeight - txtOffset + textHeight * j)
        }
    }
}
function clickedOnButton(mousePos)
{
    selectedUIElement = null // reset this, when clicking :)
    mousePos = { x: (mousePos.x - UIOffSet.x) / screenWidth, y: (mousePos.y - UIOffSet.y) / screenHeight }
    // see if a button is pressed
    for (var i = 0; i < AllUI.length; i++)
    {
        const uiElement = AllUI[i]
        const x = uiElement.x + UIOffSet.x
        const y = uiElement.y + UIOffSet.y
        if (mousePos.x > x && mousePos.x < x + uiElement.w && mousePos.y > y && mousePos.y < y + uiElement.h)
        {
            //console.log("Clicked: " + uiElement.text)
            if (uiElement.onClick != null)
            {
                var mp = { x: (mousePos.x - x) / uiElement.w, y: (mousePos.y - y) / uiElement.h }
                uiElement.onClick(mp)
            }
            if (uiElement.isInteractable)
                selectedUIElement = uiElement
            return true
        }
    }
    return false
}