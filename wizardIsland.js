const url = "https://localhost:7198"
//const url = "https://wizardislandrestapi.azurewebsites.net/"

var playerId = -1
var playerPassword = ""
var gameTick = -1
var gameId = -1
var availableGames = []
var mapData = null
var gameData = null
var gameDuration = 1
var gameTicksPerSecond = 30

var cameraPos = {x:0, y: 0}
var cameraView = {x:100, y: 56.25}
var quickCast = true

const lavaColor = "rgb(255, 150, 0)"
const groundColor = "rgb(75, 39, 0)"

var availableSpells = []
var selectedSpellIds = []
var heldCameraMovementButtons = [false, false, false, false]

var spellToCast = -1
var shouldFollowPlayer = true

var spellCooldownButtons = []

var myName = ""
var myColor = {r:Math.floor(Math.random() * 150), g:Math.floor(Math.random() * 150), b:Math.floor(Math.random() * 150)} 
var framesSinceLastDataRecieved = 0

const spriteDictionary = {}

var playerStats = []

async function start()
{
    loadImages()
    await getAvailableGames()
}

function loadImages() {
    spriteDictionary["FireBall"] = loadOneImage("FireBall")
    spriteDictionary["HomingBolt"] = loadOneImage("HomingBolt")
    spriteDictionary["FrostField"] = loadOneImage("FrostField")
    spriteDictionary["Barrel"] = loadOneImage("Barrel")
    spriteDictionary["CrescentMoon"] = loadOneImage("CrescentMoon")
    spriteDictionary["SnakeHead"] = loadOneImage("SnakeHead")
    spriteDictionary["SnakeBody"] = loadOneImage("SnakeBody")
    spriteDictionary["SnakeTail"] = loadOneImage("SnakeTail")
    spriteDictionary["BlackHole"] = loadOneImage("BlackHole")
    spriteDictionary["Swap"] = loadOneImage("Swap")
}
function loadOneImage(name) {
    const img = new Image();
    img.src = "res/" + name + ".png"
    return img
}

async function update()
{
    if (await getGameUpdate())
    {
        moveCamera()
        draw()
        update()
        framesSinceLastDataRecieved = 0
    }
    else
    {
        if (framesSinceLastDataRecieved++ > 10) // we need to not get gameData, for 10 updates in a row, before we disconnect
            reset()
        else update()
    }
}
function reset() 
{
    playerId = -1
    playerPassword = ""
    gameTick = -1
    gameId = -1
    availableGames = []
    gameData = null
    start()
}
function moveCamera() {
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
        const num = availableGames[i]
        addUI(.4, .1 + i * .25, .2, .2, "game: " + num, () => { joinGame(num) })
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

function customize(nameIsSelected = false)
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
        //customize(true)
        nameBtn.text[1] = myName
        draw()
    }
    if (nameIsSelected)
        selectedUIElement = nameBtn
    addUI(.1, .6, .2, .1, "Color (rgb):", () => {  }, "rgb(" + myColor.r + "," + myColor.g + ","  + myColor.b + ")")
    addUI(.35, .6, .1, .1, "", (mp) => { myColor.r = Math.floor(mp.x * 255); customize()  }, "rgb(" + myColor.r + ",0,0)")
    addUI(.50, .6, .1, .1, "", (mp) => { myColor.g = Math.floor(mp.x * 255); customize()  }, "rgb(0," + myColor.g + ",0)")
    addUI(.65, .6, .1, .1, "", (mp) => { myColor.b = Math.floor(mp.x * 255); customize()  }, "rgb(0,0," + myColor.b + ")")


    draw()
}

function selectSpells()
{
    const padding = .05;
    const columns = 3
    const btnW = (1 - (columns + 2) * padding)/(columns + 1);
    const btnH = .1;
    AllUI = []
    addUI(padding, padding, btnW, btnH, "Back", () => { createMenuButtons() })
    // show currently selected spells
    {
        const spellCount = selectedSpellIds.length
        const showCurrentSpellsHeight = textHeight / screenHeight * spellCount + padding * 2
        var spellNames = []
        for (var i = 0; i < spellCount; i++)
            spellNames.push((i+1) + ": " +availableSpells[selectedSpellIds[i]])
        addUI(padding, padding * 2 + btnH, btnW, showCurrentSpellsHeight, spellNames, () => {  })
    }
    for (var i = 0; i < availableSpells.length; i++)
    {
        const num = i
        const name = availableSpells[i]
        const x = padding + (num % columns + 1) * (btnW + padding)
        const y = padding + Math.floor(num / columns) * (btnH+padding)
        addUI(x, y, btnW, btnH, name, () => { 
            const index = selectedSpellIds.indexOf(num);
            if (index > -1) {
                selectedSpellIds.splice(index, 1);
            }
            else {
                selectedSpellIds.push(num)
            }
            selectSpells()
         })
    }
    draw()
}

function draw()
{
    // clear
    //lavaColor
    //groundColor
    context.fillStyle = lavaColor
    context.fillRect(0, 0, screenWidth, screenHeight)
    if (gameData)
    {
        if (shouldFollowPlayer)
        {
            cameraPos.x = gameData.players[playerId].pos.x
            cameraPos.y = gameData.players[playerId].pos.y
        }
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
                context.fillStyle = "rgb(" + entity.color + ")"
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

            context.fillStyle = "rgb(" + player.color + ")"
            context.beginPath();
            context.ellipse(x, y, size * scale.x, size * scale.y, 0, 0, 2 * Math.PI)
            context.fill();
            // draw health
            const healthOffset = size + 10
            context.fillStyle = "rgba(0, 0, 0, 100)"
            context.fillRect(x - size * scale.x, y + healthOffset, size * scale.x * 2, size * scale.y / 2)
            context.fillStyle = "rgba(255, 0, 0, 100)"
            const currentHealth = player.health / player.maxHealth
            context.fillRect(x - size * scale.x, y + healthOffset, size * scale.x * 2 * currentHealth, size * scale.y / 2)
            // draw name
            context.fillStyle = "rgba(255,255,255)"
            context.fillText(player.name, x - context.measureText(player.name).width / 2, y - size * scale.y - 10)
        }
        // game progress and stats
        {
            context.fillStyle = "rgb(255, 255, 255)"
            var txt = Math.floor(gameTick / gameDuration * 100) + "% match complete"
            var textSize = context.measureText(txt)
            context.fillText(txt,
                screenWidth / 2 - textSize.width / 2,
                20)
            // current event
            txt = "Current event: " + gameData.event.name;
            textSize = context.measureText(txt)
            context.fillText(txt,
                screenWidth / 2 - textSize.width / 2,
                40)
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

    //switchBuffer()
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
    //console.log("Casting spell: " + spellToCast)
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
    }
}

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
    await doAction(1, {spellIndex: spellId, mousePos: mousePos})
}

async function move(mousePos)
{
    await doAction(0, mousePos)
}
async function doAction(actionType, actionData)
{
    console.log("Action: " + actionType + JSON.stringify(actionData))
    try {
        const packet = {
            playerId: playerId,
            password: playerPassword,
            extraData: actionType + JSON.stringify(actionData)
        }
        const response = await axios.post(url + "/" + gameId, packet)
    } catch (error) {
        console.log(error)
        
    }
}

async function getAvailableGames()
{
    try {
        const response = await axios.get(url + "/AvailableGames")
        availableGames = response.data.games
        availableSpells = response.data.availableSpells
    } catch (error) {
        console.log(error)
    }
    createMenuButtons()
}

async function createGame()
{
    UIOffSet.x = 1
    try {
        const response = await axios.post(url + "/CreateGame")
        const location = response.headers["location"].substring(1)
        await joinGame(location)
        // start game button
        addUI(.1, .1, .2, .2, "Start game", () => {startCreatedGame()})
    } catch (error) {
        await getAvailableGames()
    }
    UIOffSet.x = 0
}
async function startCreatedGame()
{
    try {
        const response = await axios.post(url + "/StartGame/" + gameId, JSON.stringify(playerPassword), { headers: {'Content-Type': 'application/json'} })
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
        const bodyData = { spells: selectedSpellIds, name: myName, color: myColor.r + "," + myColor.g + "," + myColor.b  } //JSON.stringify
        const response = await axios.post(url + "/Join/" + gameToJoinId, bodyData, { headers: {'Content-Type': 'application/json'}})
        console.log("game data: " + response.data)
        gameId = gameToJoinId
        playerId = response.data.id
        playerPassword = response.data.password
        mapData = response.data.map
        cameraPos.x = mapData.groundMiddle.x
        cameraPos.y = mapData.groundMiddle.y
        selectedSpellIds = response.data.yourSpells
        gameDuration = response.data.gameDuration
        removeMenuButtons()
        createSpellUI()
        update()
    } catch (error) {
        gameId = -1
    }
    UIOffSet.x = 0
}

async function getGameUpdate()
{
    //gameData = null
    try {
        const response = await axios.get(url + "/" + gameId, {
        headers: {
            'playerId': playerId,
            'password': playerPassword,
            'gameTick': gameTick
        }})
        gameData = response.data
        playerStats = gameData.players
        gameTick = gameData.gameTick
        mapData = gameData.map
        updateSpellUI()
        return true
    } catch (error) {
        gameData = null
        console.log("Error: \n" + error)
    }
    return false
}

function updateSpellUI() 
{
    for (var i = 0; i < selectedSpellIds.length; i++) {
        var spellIsReady = gameData.yourSpells[i].cooldownRemaining / gameTicksPerSecond
        var ready = false
        if (spellIsReady < 0)
        {
            spellIsReady = "Ready"
            ready = true
        }
        else 
            spellIsReady = spellIsReady.toFixed(2)
        spellCooldownButtons[i].text[1] = spellIsReady
        if (spellToCast == i)
            spellCooldownButtons[i].backgroundColor = "rgb(0, 255, 0)"
        else if (ready)
            spellCooldownButtons[i].backgroundColor = "rgb(0, 100, 0)"
        else
            spellCooldownButtons[i].backgroundColor = "rgb(0, 0, 0)"
    }
}

function createSpellUI()
{
    spellCooldownButtons = []
    const spellUISize = .1
    const spellUIPadding = .01
    const xOffset = .5 - (selectedSpellIds.length / 2) * spellUISize
    const yOffset = 1.0 - spellUISize
    for (var i = 0; i < selectedSpellIds.length; i++) {
        const num = i
        const txt = [availableSpells[selectedSpellIds[i]], "0"]
        const x = xOffset + spellUISize * i + spellUIPadding
        const size = spellUISize - spellUIPadding * 2
        spellCooldownButtons.push(addUI(x, yOffset + spellUIPadding, size, size, txt, onClick = () => { selectSpellToCast(num) }, backgroundColor = "rgb(0, 0, 0)", textColor = "rgb(255, 255, 255)"))
    }
}