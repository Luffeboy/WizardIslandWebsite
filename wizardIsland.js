const url = "https://localhost:7198"
//const url = "https://wizardislandapi.jeppejeppsson.dk"
const isDebugging = url == "https://localhost:7198"

var playerId = -1
var playerPassword = ""
var gameTick = -1
var gameId = -1
var availableGames = []
var mapData = null
var gameData = null
var gameDuration = 1
var gameTicksPerSecond = 30
var eventDurationInTicks = 30*30

var cameraPos = {x:0, y: 0}
var cameraView = {x:100, y: 56.25}
var quickCast = true

const lavaColor = "rgb(255, 150, 0)"
const groundColor = "rgb(75, 39, 0)"

var availableSpells = []
var spellTypes = []
var currentlyLookingAtSpellsOfType = 0
var selectedSpellIds = []
var heldCameraMovementButtons = [false, false, false, false]

var spellToCast = -1
var shouldFollowPlayer = true

var spellCooldownButtons = []

var myName = ""
var myColor = {r:Math.floor(Math.random() * 150), g:Math.floor(Math.random() * 150), b:Math.floor(Math.random() * 150)} 
var framesSinceLastDataRecieved = 0

const spriteDictionary = {}
const debuffSpriteDictionary = {}

var playerStats = []

var webSocket = null
const spellUISize = .1

const ActionPacketType =
{
    move: 0,
    spell: 1,
    selectAugment: 2,
    giveFreeAugment: 3,
}

const PacketToClientType =
{
    standard: 1,
    joinedGame: 2,
    getAugment: 3,
    gameEnded: 4,
}

async function start()
{
    readCustomizationFromLocalStorage()
    loadImages()
    await getAvailableGames()
}

function loadImages() 
{
    const sprites = ["Wizard", "FireBall", "HomingBolt", 
        "FrostField", "Barrel", "CrescentMoon", 
        "SnakeHead", "SnakeBody", "SnakeTail",
        "BlackHole", "Swap", "Crator",
        "BloodWormTail", "BloodWormBody", "BloodWormHead", 
        "RailgunPartical", "BlackjackHitHelper", "BlackjackStandHelper"]
    for (var i = 1; i < 7; i++)
        sprites.push("dice/ChaosDice"+i)

    for (var i = 0; i < sprites.length; i++)
    {
        var entityId = sprites[i]
        const lastSlashIndex = entityId.lastIndexOf("/")
        if (lastSlashIndex != -1)
            entityId = entityId.substring(lastSlashIndex + 1)
        spriteDictionary[entityId] = loadOneImage(sprites[i])
    }

    const debuffs = ["Invulnerability", "Shackled", "Slowed", 
        "Speed", "Brick", "Regeneration", 
        "BlackjackDealer", "BlackjackPlayer", "DeckOfCardsCardCount"]
    for (var i = 0; i < debuffs.length; i++)
        debuffSpriteDictionary[debuffs[i]] = loadOneImage("debuffs/"+debuffs[i])
}

function loadOneImage(name) 
{
    const img = new Image();
    img.src = "res/" + name + ".png"
    //await img
    return img
}

function reset() 
{
    playerId = -1
    playerPassword = ""
    gameTick = -1
    gameId = -1
    availableGames = []
    gameData = null
    window.onbeforeunload = null
    getAvailableGames()
}

function moveCamera() 
{
    if (shouldFollowPlayer)
    {
        const myPlayer = gameData.players[playerId]
        const camSpeed = 1/2.5
        const velocityMultiplier = 3
        const jitterPreventionThreshold = .1
        const targetPos = { x: myPlayer.pos.x + myPlayer.velocity.x * velocityMultiplier, 
                            y: myPlayer.pos.y + myPlayer.velocity.y * velocityMultiplier }
        if  ((targetPos.x - cameraPos.x) * (targetPos.x - cameraPos.x) +
            (targetPos.y - cameraPos.y) * (targetPos.y - cameraPos.y)
            > jitterPreventionThreshold)
        {
            cameraPos.x += (targetPos.x - cameraPos.x) * camSpeed
            cameraPos.y += (targetPos.y - cameraPos.y) * camSpeed
        }
        return
    }
    if (heldCameraMovementButtons[0])
        cameraPos.x++
    if (heldCameraMovementButtons[1])
        cameraPos.x--
    if (heldCameraMovementButtons[2])
        cameraPos.y++
    if (heldCameraMovementButtons[3])
        cameraPos.y--
}

function removeMenuButtons()
{
    clearUIButtons()
    draw()
}

function createMenuButtons()
{
    clearUIButtons()

    // create game btn
    addUI(.1, .1, .2, .2, "Create new game", () => {createGame()})
    // re-search for games btn
    addUI(.1, .35, .2, .2, "Search again...", () => {getAvailableGames()})
    // select spells
    addUI(.1, .6, .2, .2, "Select spells", () => { selectSpells() })
    // customise
    addUI(.1, .85, .2, .2, "Customize", () => { customize() })

    // show all found games
    for (var i = 0; i < availableGames.length; i++)
    {
        const num = availableGames[i].id
        const gameDataText = ["Game with " + availableGames[i].playerCount + " player(s)", 
                              "Created by: " + availableGames[i].creatorName,
                              "Allowed spells: " + availableGames[i].spellCount]
        addUI(.4, .1 + i * .25, .2, .2, gameDataText, () => { joinGame(num) })
    }
    // show previous games stats
    if (playerStats.length != 0)
    {
        txt = [playerStats.length + 1]
        txt[0] = "Previous games player stats (Name: kills / deaths):"
        for (var i = 0; i < playerStats.length; i++)
        {
            const player = playerStats[i]
            txt[i+1] = player.name + ": " + player.kills + " / " + player.deaths
        }
        addUI(.7, .1, .2, .1 + (txt.length * textHeight / screenHeight), txt)
    }
    draw()
}

function customize()
{
    clearUIButtons()
    addUI(.1, .1, .2, .1, "Back", () => { createMenuButtons() })
    const nameBtnText = ["Name:", myName]
    const nameBtn = addUI(.1, .35, .2, .1, nameBtnText, () => {  })
    nameBtn.isInteractable = true
    nameBtn.onKeyPress = (event) => { 
        if (event.keyCode == 8) // backspace
        {
            if (myName.length > 0)
            {
                myName = myName.substring(0, myName.length - 1)
            }
        } else if (!event.key || event.key.length != 1)
            return
        else if ((event.key >= 'a' && event.key <= 'z') || (event.key >= 'A' && event.key <= 'Z') || event.key == ' ')
        {
            myName += event.key
        }
        nameBtn.text[1] = myName
        saveCustomizationToLocalStorage();
        draw()
    }
    addUI(.1, .6, .2, .1, "Color (rgb):", () => {  }, "rgb(" + myColor.r + "," + myColor.g + ","  + myColor.b + ")")
    addUI(.35, .6, .1, .1, "", (mp) => { myColor.r = Math.floor(mp.x * 255); saveCustomizationToLocalStorage(); customize()  }, "rgb(" + myColor.r + ",0,0)")
    addUI(.50, .6, .1, .1, "", (mp) => { myColor.g = Math.floor(mp.x * 255); saveCustomizationToLocalStorage(); customize()  }, "rgb(0," + myColor.g + ",0)")
    addUI(.65, .6, .1, .1, "", (mp) => { myColor.b = Math.floor(mp.x * 255); saveCustomizationToLocalStorage(); customize()  }, "rgb(0,0," + myColor.b + ")")
    var colorPickerData = null
    addUI(.80, .6, .1, .1, [], (mp) => {
        if (colorPickerData == null)
        {
            console.log("No color picker data")
            return
        }
        const x = .5 + (mp.x - .5) * colorPickerData.width / colorPickerData.radius / 2
        const y = .5 + (mp.y - .5) * colorPickerData.height / colorPickerData.radius / 2
        var col = getColorFromColorPicker(x, y);
        if (col == null)
            return
        myColor.r = col.r
        myColor.g = col.g
        myColor.b = col.b
        saveCustomizationToLocalStorage();
        customize()
        }, "rgba(0, 0, 0, 0)", "rgba(255, 255, 255, 0)", false, null, null, null, (x, y, w, h) =>
        {
            colorPickerData = drawColorPicker(x + w / 2, y + h / 2, w, h, context)
        })
    draw()
}

function saveCustomizationToLocalStorage()
{
    localStorage.setItem("username", myName);
    localStorage.setItem("preferredColor", JSON.stringify(myColor));
}

function readCustomizationFromLocalStorage()
{
    const name = localStorage.getItem("username")
    myName = name ? name : myName
    const color = localStorage.getItem("preferredColor")
    if (color)
        myColor = JSON.parse(color);
}

function selectSpells()
{
    const padding = .05;
    const columns = 3
    const btnW = (1 - (columns + 2) * padding)/(columns + 1);
    const btnH = .1;
    const uiOffSet = UIOffSet
    clearUIButtons()
    UIOffSet = uiOffSet
    addUI(padding, padding, btnW, btnH, "Back", () => { createMenuButtons() })
    // show currently selected spells
    {
        const selectedSpellButtons = addUIV2(new UIElement({x:padding, y: padding * 2 + btnH, 
                                                            w: btnW, h: 1-(padding * 3 + btnH),
                                                        backgroundColor: "rgba(0,0,0,.1)"}))
        function createSelectedSpellButtons()
        {
            selectedSpellButtons.clearChildren()
            const spellCount = selectedSpellIds.length
            const amountToSide = .3
            for (var i = 0; i < spellCount; i++)
            {
                const index = i
                addUIV2(new UIElement({x: padding, y: padding + (btnH + padding) * i, w: 1-padding*2, h: btnH, text: availableSpells[selectedSpellIds[i]].name, onClick: (mp) => 
                    {
                        const selectedSpellIdsIndex = selectedSpellIds[index]
                        if (mp.y < amountToSide)
                        {
                            if (index > 0)
                            {
                                selectedSpellIds[index] = selectedSpellIds[index - 1]
                                selectedSpellIds[index - 1] = selectedSpellIdsIndex
                            }
                            
                        }
                        else if (mp.y > 1-amountToSide)
                        {
                            if (index < selectedSpellIds.length - 1)
                            {
                                selectedSpellIds[index] = selectedSpellIds[index + 1]
                                selectedSpellIds[index + 1] = selectedSpellIdsIndex
                            }
                        }
                        else if (mp.x < amountToSide)
                        {
                            selectedSpellIds.splice(index, 1);
                        }
                        createSelectedSpellButtons()
                        draw()
                    }, backgroundColor: "rgb(0, 0, 0)", textColor: "rgb(255, 255, 255)", onHover: (mp) =>
                        {
                            var text = null
                            var col = ""
                            if (mp.y < amountToSide)
                            {
                                col = "0,255,0"
                                if (index > 0)
                                    text = "Move up"
                            } else if (mp.y > 1-amountToSide)
                            {
                                col = "0,255,0"
                                if (index < selectedSpellIds.length - 1)
                                    text = "Move down"
                            } else if (mp.x < amountToSide)
                            {
                                col = "255,0,0"
                                text = "Remove"
                            }
                            draw()
                            if (text)
                            {
                                context.fillStyle = "rgb(" + col + ")"
                                context.fillText(text, MousePosition.x, MousePosition.y - (textHeight + 5))
                            }
                        }, endHover: ()=>{draw()}}), selectedSpellButtons)
            }
            selectedSpellButtons.tryCreateScrollbar()
            selectedSpellButtons.checkScrollIsNotOutOfBounds()
        }
        createSelectedSpellButtons()
    }
    for (var i = 0; i < spellTypes.length; i++)
    {
        const num = i
        const btnBgCol = (currentlyLookingAtSpellsOfType == num) ? "rgb(50, 50, 50)" : "rgb(0, 0, 0)"
        addUI(padding + (padding + btnW) * (i+1), padding, btnW, btnH, spellTypes[num], () => { currentlyLookingAtSpellsOfType = num; selectSpells() }, btnBgCol)
    }

    var spellsToDisplay = []
    for (var i = 0; i < availableSpells.length; i++)
        if (availableSpells[i].type == currentlyLookingAtSpellsOfType)
            spellsToDisplay.push({id: i, spellInfo: availableSpells[i]})

    var spellCanvas = addUIV2(new UIElement({x: padding + (btnW + padding), y: padding + (padding + btnH), 
             w: (columns) * (btnW + padding) - padding, h: 1 - (padding * 3 + btnH),
            backgroundColor: "rgba(0,0,0, .1)"}))
    for (var i = 0; i < spellsToDisplay.length; i++)
    {
        const num = i
        const name = spellsToDisplay[num].spellInfo.name
        const cooldown = spellsToDisplay[num].spellInfo.cooldown
        const fullW = 1 / columns
        const w = 1 / (columns + 1)
        const x = padding + (num % columns) * fullW
        const y = Math.floor(num / columns) * (btnH+padding) + padding
        
        const spellId = spellsToDisplay[i].id
        addUIV2(new UIElement({x: x, y: y, w: w, h: btnH, text: [name, "Cooldown: " + cooldown.toFixed(2)], onClick: () => { 
            const index = selectedSpellIds.indexOf(spellId);
            if (index > -1) {
                selectedSpellIds.splice(index, 1);
            }
            else {
                selectedSpellIds.push(spellId)
            }
            createSelectedSpellButtons()
            draw()
         }}), spellCanvas)
    }
    spellCanvas.tryCreateScrollbar()
    
    draw()
}

function draw()
{
    // clear
    context.fillStyle = lavaColor
    context.fillRect(0, 0, screenWidth, screenHeight)
    if (gameData)
    {
        cameraView.y = cameraView.x * screenHeight / screenWidth
        scale = { x: screenWidth / cameraView.x, y: screenHeight / cameraView.y }
        function getX(x){ return (x - cameraPos.x + cameraView.x / 2) * scale.x }
        function getY(y){ return (y - cameraPos.y + cameraView.y / 2) * scale.y }

        // draw ground
        context.fillStyle = groundColor
        context.beginPath();
        context.ellipse(getX(mapData.groundMiddle.x), getY(mapData.groundMiddle.y), mapData.circleRadius * scale.x, mapData.circleRadius * scale.y, 0, 0, 2 * Math.PI)
        context.fill();
        // draw inner lava
        context.fillStyle = lavaColor
        context.beginPath();
        context.ellipse(getX(mapData.groundMiddle.x), getY(mapData.groundMiddle.y), mapData.circleInnerRadius * scale.x, mapData.circleInnerRadius * scale.y, 0, 0, 2 * Math.PI)
        context.fill();

        // draw spells
        for (var i = 0; i < gameData.entities.length; i++) {
            const entity = gameData.entities[i]
            const x = getX(entity.pos.x);
            const y = getY(entity.pos.y);
            const size = entity.size
            // draw sprite, if we have one for this entity
            //console.log(entity);
            if (spriteDictionary[entity.entityId]) {
                const img = spriteDictionary[entity.entityId]
                const extraSizeMult = 2.1
                const scaledSize = {x: size * scale.x * extraSizeMult, y: size * scale.y * extraSizeMult}
                drawPixelatedImage(img, x,  y, scaledSize.x, scaledSize.y, entity.angle)
            }
            else {
                context.fillStyle = "rgba(" + entity.color + "," + entity.transparancy + ")"
                context.beginPath();
                context.ellipse(x, y, size * scale.x, size * scale.y, 0, 0, 2 * Math.PI)
                context.fill();
            }
        }

        // draw characters
        for (var i = 0; i < gameData.players.length; i++)
        {
            const player = gameData.players[i]
            if (player.isDead) {
                continue;
            }
            const x = getX(player.pos.x);// = (player.pos.x - cameraPos.x) * scale.x
            const y = getY(player.pos.y);// = (player.pos.y - cameraPos.y) * scale.y
            const size = player.size
            const outlineWidth = .1
            // outline
            context.beginPath();
            if (i == playerId){
                context.fillStyle = "rgb(0, 0, 255)"
            } else {
                context.fillStyle = "rgb(255,255,255)"
            }
            context.ellipse(x - outlineWidth / 2, y - outlineWidth / 2, size * scale.x + outlineWidth * scale.x, size * scale.y + outlineWidth * scale.y, 0, 0, 2 * Math.PI)
            context.fill();

            //context.fillStyle = "rgb(" + player.color + ")"
            context.fillStyle = "rgb(255,255,255)" // for the outline
            context.beginPath();
            context.ellipse(x, y, size * scale.x, size * scale.y, 0, 0, 2 * Math.PI)
            context.fill();
            drawColorGradedImage(spriteDictionary["Wizard"], x, y, size * scale.x, size * scale.y, 0, player.color)
            // draw health
            const healthOffset = size + 10
            const healthYSize = size * scale.y / 2
            context.fillStyle = "rgba(0, 0, 0, 100)"
            context.fillRect(x - size * scale.x, y + healthOffset, size * scale.x * 2, healthYSize)
            context.fillStyle = "rgba(255, 0, 0, 100)"
            const currentHealth = player.health / player.maxHealth
            context.fillRect(x - size * scale.x, y + healthOffset, size * scale.x * 2 * currentHealth, healthYSize)
            // draw name
            context.fillStyle = "rgba(255,255,255)"
            context.fillText(player.name, x - context.measureText(player.name).width / 2, y - size * scale.y - 10)
            // draw debuffs
            const debuffCount = player.debuffs.length
            const debuffSize = 25;
            for (var j = 0; j < debuffCount; j++) {
                const debuff = player.debuffs[j]
                if (debuffSpriteDictionary[debuff.name])
                {
                    const debuffX = x + (j - debuffCount/2 + .5) * debuffSize
                    const debuffY = y + healthOffset + healthYSize + debuffSize / 2
                    drawPixelatedImage(debuffSpriteDictionary[debuff.name], debuffX, debuffY, debuffSize, debuffSize)
                    if (debuff.stacks > 1)
                    {
                        const text = "" + debuff.stacks
                        const textWidth = context.measureText(text).width
                        const textHeightTemp = textHeight * 2 / 3
                        setTextSize(textHeightTemp)
                        context.fillText(text, 
                                         debuffX - textWidth / 2, 
                                         debuffY + textHeightTemp / 2)
                        resetTextSize()
                    }
                }
            }
        }
        // game progress and stats
        {
            context.fillStyle = "rgb(255, 255, 255)"
            var txt = Math.floor(gameTick / gameDuration * 100) + "% match complete"
            var textSize = context.measureText(txt)
            context.fillText(txt, screenWidth / 2 - textSize.width / 2, 20)
            // event progress
            {
                const middlePos = {x:screenWidth / 2, y:20}
                const progress = (gameTick % eventDurationInTicks) / eventDurationInTicks
                const invertedProgress = 1 - progress
                const padding = 5
                txt = "Current event: " + gameData.event.name;
                textSize = context.measureText(txt).width
                nextEventTxt = "Next event: " + gameData.nextEvent.name
                NextEventTextSize = context.measureText(nextEventTxt).width
                var eventBoxW = screenWidth / 6
                if (eventBoxW < textSize + padding * 2) eventBoxW = textSize + padding * 2
                if (eventBoxW < NextEventTextSize + padding * 2) eventBoxW = NextEventTextSize + padding * 2
                const eventBoxX = middlePos.x - eventBoxW / 2
                const eventBoxY = middlePos.y + padding
                const eventBoxH = 10 + textHeight + padding * 2
                const eventBoxNewW = eventBoxW * progress
                //const eventBoxCurrentW = eventBoxW * invertedProgress
                // draw background
                context.fillStyle = "rgb(0, 255, 0)"
                context.fillRect(eventBoxX, eventBoxY, eventBoxW, eventBoxH)
                // 
                // var textProgression = easeInOutSineWithPow(progress,.75)
                // current event
                context.fillStyle = "rgb(255, 255, 255)"
                const eventTxtPos = eventBoxX + eventBoxW - padding - textSize
                context.fillText(txt, eventTxtPos, eventBoxY + eventBoxH / 2 + textHeight / 4)
                // next event

                if (eventBoxNewW > 5)// the reason we do this, is so we can cut part of the text
                    context.drawImage(
                        drawOnExtraCanvas(eventBoxNewW, eventBoxH+2, (ctx) => {
                        ctx.fillStyle = "rgb(255, 0, 0)"
                        ctx.fillRect(0, 0, eventBoxNewW, eventBoxH+10)
                        ctx.fillStyle = "rgb(255, 255, 255)"
                        ctx.fillText(nextEventTxt, 0,eventBoxH/2+textHeight/4)
                    }), eventBoxX-1, eventBoxY-1)
                // middle
                const eventMiddleW = 5
                const eventMiddleH = 5
                context.fillStyle = "rgb("+(255*progress)+","+(255*invertedProgress)+", 0)"
                context.fillRect(eventBoxX+eventBoxNewW-eventMiddleW/2,eventBoxY-eventMiddleH/2,eventMiddleW,eventBoxH+eventMiddleH)
            }
            context.fillStyle = "rgb(255,255,255)"
            // kills text
            txt = gameData.players[playerId].kills + " kills"
            textSize = context.measureText(txt)
            context.fillText(txt,
                screenWidth - textSize.width - 10,
                20)
            // deaths text
            txt = gameData.players[playerId].deaths + " deaths"
            textSize = context.measureText(txt)
            context.fillText(txt,
                screenWidth - textSize.width - 10,
                40)
        }
    }
    // draw UI
    drawUI()
}

function clickedOnPage(event)
{
    const mousePos = { x : event.layerX, y : event.layerY }
    if (clickedOnButton(mousePos))
        return
    // if we are not ingame, dont do any more
    if (gameId == -1 || gameId == null)
        return
    const mousePosWorld = { x: mousePos.x * cameraView.x / screenWidth  + cameraPos.x - cameraView.x / 2, 
                            y: mousePos.y * cameraView.y / screenHeight + cameraPos.y - cameraView.y / 2 }
    // cast spell?
    if (spellToCast != -1)
    {
        castSpell(spellToCast, mousePosWorld)
        spellToCast = -1
        return
    }
    // do other stuff
    move(mousePosWorld)
}

function keyboardDown(event)
{
    // check ui first
    if (selectedUIElement != null)
    {
        if (selectedUIElement.onKeyPress != null)
            selectedUIElement.onKeyPress(event)
        return
    }
    // quick disconnect, by tapping "-" 3 times in a row
    if (event.keyCode == 189)
    {
        minusInARowToDisconnect--;
        if (minusInARowToDisconnect <= 0)
            disconnectFromServer()
        return
    }
    minusInARowToDisconnect = minusInARowToDisconnectMax

    if (gameId == -1 || event.keyCode < 32 || event.keyCode > 90) // 32 is space, 90 is 'z'
    {
        // not ingame
        if (event.key == 'w')
            UIOffSet.y += .1;
        if (event.key == 's')
            UIOffSet.y -= .1;
        draw()
        return
    }
    event.preventDefault()
    const spellToUse = event.key - '1'
    //console.log("Spell to use: " + spellToUse)
    if (!isNaN(spellToUse) && spellToUse >= 0 && spellToUse < selectedSpellIds.length)
    {
        selectSpellToCast(spellToUse)
        return
    }
    if (event.key == ' ')
    {
        cameraPos.x = mapData.groundMiddle.x
        cameraPos.y = mapData.groundMiddle.y
        return
    }
    // move camera
    switch (event.key)
    {
        case ' ':
            cameraPos.x = mapData.groundMiddle.x
            cameraPos.y = mapData.groundMiddle.y
            return
        case 'y':
            shouldFollowPlayer = !shouldFollowPlayer
            return
        case 'd':
        case "ArrowRight":
            heldCameraMovementButtons[0] = true
            return
        case 'a':
        case "ArrowLeft":
            heldCameraMovementButtons[1] = true
            return
        case 's':
        case "ArrowDown":
            heldCameraMovementButtons[2] = true
            return
        case 'w':
        case "ArrowUp":
            heldCameraMovementButtons[3] = true
            return
        case "p":
            doAction(ActionPacketType.giveFreeAugment, " ")
            return
    }
}
const minusInARowToDisconnectMax = 3;
var minusInARowToDisconnect = minusInARowToDisconnectMax;

function keyboardUp(event)
{
    if (!gameId || gameId == -1 || !event.key)
        return
    event.preventDefault()
    switch (event.key)
    {
        case 'd':
        case "ArrowRight":
            heldCameraMovementButtons[0] = false
            return
        case 'a':
        case "ArrowLeft":
            heldCameraMovementButtons[1] = false
            return
        case 's':
        case "ArrowDown":
            heldCameraMovementButtons[2] = false
            return
        case 'w':
        case "ArrowUp":
            heldCameraMovementButtons[3] = false
            return
    }
}

function selectSpellToCast(spellId)
{
    if (quickCast)
    {
        const mousePosWorld = { x: MousePosition.x * cameraView.x / screenWidth  + cameraPos.x - cameraView.x / 2, 
                                y: MousePosition.y * cameraView.y / screenHeight + cameraPos.y - cameraView.y / 2 }
        castSpell(spellId, mousePosWorld)
        return
    }
    if (spellToCast == spellId)
        spellToCast = -1
    else
        spellToCast = spellId
}
async function castSpell(spellId, mousePos)
{
    await doAction(ActionPacketType.spell, {spellIndex: spellId, mousePos: mousePos})
}

async function move(mousePos)
{
    await doAction(ActionPacketType.move, mousePos)
}

async function doAction(actionType, actionData)
{
    if (webSocket == null || webSocket.readyState != WebSocket.OPEN)
        return
    //console.log("Action: " + actionType + JSON.stringify(actionData))
    try {
        const packet = {
            ExtraData: actionType + ' ' + JSON.stringify(actionData)
        }
        webSocket.send(JSON.stringify(packet))
    } catch (error) {
        console.log(error)
    }
}

async function getAvailableGames()
{
    try {
        const response = await fetch(url + "/AvailableGames")
        var data = await response.json()
        availableGames = data.games
        availableSpells = data.availableSpells
        spellTypes = data.spellTypes
    } catch (error) {
        console.log(error)
    }
    createMenuButtons()
}

async function createGame()
{
    UIOffSet.x = 1
    try {
        const response = await fetch(url + "/CreateGame",
            {
                method: "POST"
            }
        )
        const location = response.headers.get("location").substring(1)
        await joinGame(location)
        // start game button
        addUI(.1, .1, .2, .2, "Start game", () => {startCreatedGame()})
    } catch (error) {
        console.log(error)
        await getAvailableGames()
    }
    UIOffSet.x = 0
}
async function startCreatedGame()
{
    try {
        const response = await fetch(url + "/StartGame/" + gameId,
            {
                method: "POST",
                body: JSON.stringify(playerPassword),
                headers: {
                    "Content-type": "application/json;"
                }
            }
        )
        removeMenuButtons()
        createSpellUI()
    } catch (error) {
        console.log(error)
    }
}

async function joinGame(gameToJoinId)
{
    if (selectedSpellIds.length == 0)
        for (var i = 0; i < availableSpells.length; i++)
        selectedSpellIds.push(i)
    UIOffSet.x = 1
    try {
        gameId = gameToJoinId
        webSocket = new WebSocket(url + "/joinGame?id="+gameToJoinId)
        setupWebsocket()
        if (!isDebugging)
        window.onbeforeunload = function() {
            return true;
        };
        removeMenuButtons()
        createSpellUI()
    } catch (error) {
        gameId = -1
        console.log(error)
    }
    UIOffSet.x = 0
}


function setupWebsocket()
{
    // Connection opened
    webSocket.addEventListener("open", (event) => {
        const bodyData = { Spells: selectedSpellIds, Name: myName, Color: myColor.r + "," + myColor.g + "," + myColor.b  }
        webSocket.send(JSON.stringify(bodyData))
    })

    // Listen for messages
    webSocket.addEventListener("message", RecieveData)
    webSocket.addEventListener("close", (event) => 
    {
        disconnectFromServer()
    })
}

function disconnectFromServer()
{
    if (webSocket != null)
        webSocket.close()
    minusInARowToDisconnect = minusInARowToDisconnectMax
    webSocket = null
    reset()
}

function RecieveData(event)
{
    var data = JSON.parse(event.data)
    if (data.dataType)
    {
        const dataType = data.dataType
        data = data.data

        switch (dataType)
        {
            case PacketToClientType.standard:
                endAugmentPhase()
                gameData = data
                playerStats = gameData.players
                gameTick = gameData.gameTick
                mapData = gameData.map
                
                moveCamera()
                updateSpellUI()
                break

            case PacketToClientType.joinedGame:
                playerId = data.id
                playerPassword = data.password
                mapData = data.map
                cameraPos.x = mapData.groundMiddle.x
                cameraPos.y = mapData.groundMiddle.y
                selectedSpellIds = data.yourSpells
                gameDuration = data.gameDuration
                eventDurationInTicks = data.eventDuration
                break

            case PacketToClientType.getAugment:
                gotAugments(data.augmentData, data.timeRemaining)
                break

            case PacketToClientType.gameEnded:
                disconnectFromServer()
                break
        }
    }
    draw()
}

function updateSpellUI() 
{
    for (var i = 0; i < selectedSpellIds.length; i++) {
        const name = gameData.yourSpells[i].spellName.split("\n");
        var spellIsReady = gameData.yourSpells[i].cooldownRemaining / gameTicksPerSecond
        var ready = spellIsReady < 0
        if (ready)
            spellIsReady = "Ready"
        else 
            spellIsReady = spellIsReady.toFixed(2)
        spellCooldownButtons[i].text = name
        spellCooldownButtons[i].text.push(spellIsReady)
        if (spellToCast == i)
            spellCooldownButtons[i].backgroundColor = "rgb(0, 255, 0)"
        else if (ready)
            spellCooldownButtons[i].backgroundColor = "rgb(0, 100, 0)"
        else
            spellCooldownButtons[i].backgroundColor = "rgb(0, 0, 0)"
        // fix button height
        const spellUIPadding = .01
        const btnMinHeight = textHeight * spellCooldownButtons[i].text.length / screenHeight + 2 * spellUIPadding
        spellCooldownButtons[i].h = (spellUISize < btnMinHeight) ? btnMinHeight : spellUISize
    }
}

function createSpellUI()
{
    spellCooldownButtons = []
    const spellUIPadding = .01
    const xOffset = .5 - (selectedSpellIds.length / 2) * spellUISize
    const yOffset = 1.0 - spellUISize
    for (var i = 0; i < selectedSpellIds.length; i++) {
        const num = i
        const txt = [availableSpells[selectedSpellIds[i]].name, "0"]
        const x = xOffset + spellUISize * i + spellUIPadding
        const size = spellUISize - spellUIPadding * 2
        spellCooldownButtons.push(addUI(x, yOffset + spellUIPadding, size, size, txt, onClick = () => { var hasQuickCast = quickCast; quickCast = false; selectSpellToCast(num); quickCast = hasQuickCast; }, backgroundColor = "rgb(0, 0, 0)", textColor = "rgb(255, 255, 255)"))
    }
}