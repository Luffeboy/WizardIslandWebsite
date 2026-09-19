AllUIV2 = []
var selectedUIElementV2 = null
var hoveringUIElementV2 = null
var holdingUIElementV2 = null

class UIElement
{
    constructor(object)
    {
        this.x = object?.x ?? 0
        this.y = object?.y ?? 0
        this.w = object?.w ?? 1
        this.h = object?.h ?? 1
        this.text = object?.text ?? []
        if (!Array.isArray(this.text)) {
            this.text = [this.text]
        }
        var fn = object?.onClick ?? null
        if (fn != null && fn.length == 0)
            fn = (mp) => {object.onClick()}
        this.onClick = fn
        this.backgroundColor = object?.backgroundColor ?? "rgb(0, 0, 0)"
        this.textColor = object?.textColor ?? "rgb(255, 255, 255)"
        this.isSelectable = object?.isSelectable ?? false
        this.ignoreMouse = object?.ignoreMouse ?? false
        this.onKeyPress = object?.onKeyPress ?? null
        this.onHover = object?.onHover ?? null
        this.endHover = object?.endHover ?? null
        this.additionalDrawFunction = object?.additionalDrawFunction ?? null
        this.childElements = object?.childElements ?? []
        this.parentElement = object?.parentElement ?? null
        this.scrollX = 0
        this.scrollY = 0

        this.scrollbarY = null
        this.scrollMaxDiffY = 1
    }

    uiElementWasAdded()
    {
        if (this.scrollbarY != null)
            this.updateScrollbar()
    }

    updateScrollbar()
    {
        const lastChild = this.childElements[this.childElements.length-1]
        this.scrollbarY.childElements[0].h = 1 / (lastChild.y + lastChild.h)
        this.scrollMaxDiffY = lastChild.y + lastChild.h - 1
    }

    tryCreateScrollbar()
    {
        if (this.childElements.length == 0)
            return
        const lastChild = this.childElements[this.childElements.length-1]
        if (this.scrollbarY == null)
        {
            if (lastChild.y + lastChild.h <= 1)
                return
            const scrollbarThickness = .025
            this.scrollbarY = new UIElement({x: 1-scrollbarThickness, w: scrollbarThickness, backgroundColor: "rgba(0,0,0,.1)"})
            this.scrollbarY.childElements.push(new UIElement({backgroundColor: "rgba(0,0,0,.25)"}))
        }
        this.updateScrollbar()
    }

    checkScrollIsNotOutOfBounds()
    {
        if (this.scrollbarY == null)
            return
        const prevScroll = this.getCurrentScrollY()
        this.tryScroll({x: 0, y: prevScroll})
    }

    getCurrentScrollY()
    {
        return this.scrollbarY.childElements[0].y + this.scrollbarY.childElements[0].h / 2
    }

    canScroll(mp)
    {
        return this.scrollbarY != null && mp.x >= 1 - this.scrollbarY.w
    }

    tryScroll(mp)
    {
        const scrollbarYProgress = this.scrollbarY.childElements[0]
        this.scrollbarY.childElements[0].y = Math.max(0, Math.min(1 - scrollbarYProgress.h, mp.y - scrollbarYProgress.h / 2)) 
        var scaledY = this.scrollbarY.childElements[0].y / (1 - this.scrollbarY.childElements[0].h)
        this.scrollY = -scaledY * this.scrollMaxDiffY
        draw()
    }

    clearChildren()
    {
        this.childElements = []
    }

    getScrollElementY()
    {
        if (this.scrollbarY != null)
            return this
        if (this.parentElement != null)
            return this.parentElement.getScrollElementY()
        return null
    }
}

function clearUIButtonsV2()
{
    AllUIV2 = []
    UIOffSet = { x: 0,y: 0 }
}

function addUIV2(UIElement, parentElement = null)
{
    if (parentElement != null)
    {
        parentElement.childElements.push(UIElement)
        UIElement.parentElement = parentElement

        parentElement.uiElementWasAdded()

    }
    else
        AllUIV2.push(UIElement)
    return UIElement
}

function removeUIV2(uiElement)
{
    for (var i = 0; i < AllUIV2.length; i++)
    {
        if (AllUIV2[i] == uiElement)
        {
            AllUIV2.splice(i, 1)
            return
        }
    }
}

function drawUIV2()
{
    for (var i = 0; i < AllUIV2.length; i++)
    {
        const uiElement = AllUIV2[i]
        drawUIElementV2(uiElement, UIOffSet.x, UIOffSet.y, 0, 0, 1, 1)
    }
}

function drawUIElementV2(uiElement, offsetX = 0, offsetY = 0, parentX = 0, parentY = 0, parentW = 1, parentH = 1)
{
    const w = uiElement.w * parentW
    const h = uiElement.h * parentH
    const x = uiElement.x * parentW + offsetX
    const y = uiElement.y * parentH + offsetY

    const parentRect = { minX: parentX, minY: parentY, maxX: parentX + parentW, maxY: parentY + parentH }

    var drawW = ((x + w) > parentRect.maxX) ? parentRect.maxX - x : w
    var drawH = ((y + h) > parentRect.maxY) ? parentRect.maxY- y : h
    if (x > parentW + parentX || x + w < parentX ||
        y > parentH + parentY || y + h < parentY)
        return
    if (y < parentY) drawH -= parentY - y
    context.fillStyle = uiElement.backgroundColor
    context.fillRect(Math.max(x, parentX) * screenWidth, Math.max(y, parentY) * screenHeight, 
                     drawW * screenWidth, drawH * screenHeight)
    
    context.fillStyle = uiElement.textColor
    const txtOffset = textHeight * ((uiElement.text.length - 1) / 2)
    for (var j = 0; j < uiElement.text.length; j++) {
        const txt = uiElement.text[j]
        const textSize = context.measureText(txt)
        const txtX = (x + w / 2) * screenWidth - textSize.width / 2
        const txtY = (y + h / 2) * screenHeight - txtOffset + textHeight * j
        if (txtX + textSize.width / 2 < parentRect.minX * screenWidth || txtX - textSize.width / 2 > parentRect.maxX * screenWidth ||
            txtY - textHeight / 3 < parentRect.minY * screenHeight || txtY - textHeight / 3 > parentRect.maxY * screenHeight)
            continue
        context.fillText(txt, txtX, txtY)
    }
    if (uiElement.additionalDrawFunction)
        uiElement.additionalDrawFunction(x * screenWidth, y * screenHeight, w * screenWidth, h * screenHeight)
    for (var i = 0; i < uiElement.childElements.length; i++)
    {
        const childElement = uiElement.childElements[i]
        drawUIElementV2(childElement, x + uiElement.scrollX, y + uiElement.scrollY, x, y, w, h)
    }
    // scroll
    if (uiElement.scrollbarY)
        drawUIElementV2(uiElement.scrollbarY, x, y, x, y, w, h)
}

function clickedOnButtonV2(mousePos)
{
    selectedUIElementV2 = null
    const elementInfo = getUIElementAtV2MoreInfo(mousePos)
    if (elementInfo != null)
    {
        const element = elementInfo.element
        const mp = { x: elementInfo.scaledX, y: elementInfo.scaledY }
        if (element.canScroll(mp))
        {
            element.tryScroll(mp)
        }
        else
        {
            if (element.onClick != null)
            {
                element.onClick(mp)
            }
            if (element.isSelectable)
                selectedUIElement = element
        
            }
        return true
    }
    return false
}

function getUIElementAtV2(mousePos)
{
    return getUIElementAtV2MoreInfo(mousePos)?.element ?? null
}

function getUIElementAtV2MoreInfo(mousePos)
{
    // fix with scroll
    // see if a button is pressed
    for (var i = 0; i < AllUIV2.length; i++)
    {
        const uiElement = AllUIV2[i]
        const x = uiElement.x + UIOffSet.x
        const y = uiElement.y + UIOffSet.y
        if (mousePos.x > x && mousePos.x < x + uiElement.w && mousePos.y > y && mousePos.y < y + uiElement.h)
        {
            const transformedMousePos = { x: (mousePos.x - x - uiElement.scrollX) / uiElement.w, 
                                        y: (mousePos.y - y - uiElement.scrollY) / uiElement.h }
            //console.log("scroll: " + uiElement.scrollY)
            const potentialChildElement = getUIElementInsideOtherElementV2MoreInfo(uiElement, transformedMousePos)
            if (potentialChildElement != null)
                return potentialChildElement
            return {element: uiElement, scaledX: (mousePos.x - x) / uiElement.w, scaledY: (mousePos.y - y) / uiElement.h }
        }
    }
    return null
}

function getUIElementInsideOtherElementV2MoreInfo(oldUiElement, mousePos)
{
    for (var i = 0; i < oldUiElement.childElements.length; i++)
    {
        const uiElement = oldUiElement.childElements[i]
        const x = uiElement.x
        const y = uiElement.y
        if (mousePos.x > x && mousePos.x < x + uiElement.w && mousePos.y > y && mousePos.y < y + uiElement.h)
        {
            const transformedMousePos = { x: (mousePos.x - x) / uiElement.w, 
                                        y: (mousePos.y - y) / uiElement.h }
            const potentialChildElement = getUIElementInsideOtherElementV2MoreInfo(uiElement, transformedMousePos)
            if (potentialChildElement != null)
                return potentialChildElement
            return {element: uiElement, scaledX: (mousePos.x - x) / uiElement.w, scaledY: (mousePos.y - y) / uiElement.h }
        }
    }
    return null
}