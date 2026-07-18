var augmentsYouCanChoose = null
var augmentsUIButtons = []
var selectedAugmentIndex = -1
var augmentTimeRemaining = -1
var augmentTimeRemainingMax = -1

function gotAugments(augments, timeRemaining)
{
    augmentTimeRemaining = timeRemaining
    if (augments == null)
    {
        augmentsUIButtons[0].text = ["Time until resuming: " + augmentTimeRemaining.toFixed(2)]
        const minTransparency = .1
        const transparency = Math.min(augmentTimeRemaining / (augmentTimeRemainingMax / 10), 1 - minTransparency) + minTransparency
        augmentsUIButtons[0].backgroundColor = "rgb(0,0,0,"+(transparency)+")"
        return
    }
    if (augmentsYouCanChoose != null)
        return
    augmentTimeRemainingMax = timeRemaining
    augmentsYouCanChoose = augments
    displayAugmentsToChoose(augmentsYouCanChoose)
}

function displayAugmentsToChoose(augments)
{
    clearAugmentsUIButtons()
    if (augments == null || augments.length == 0)
        return
    const btnPaddingW = .01
    const btnPaddingY = .05
    const confirmAugmentBtnHeight = .15
    const confirmAugmentBtnWithPaddingHeight = confirmAugmentBtnHeight + btnPaddingY * 2
    
    const btnHeight = 1 - btnPaddingY * 2 - confirmAugmentBtnWithPaddingHeight
    const btnWidth = ((1 - btnPaddingW * (2 + augments.length))) / augments.length
    const widthWithoutPadding = (1 - btnPaddingW * 2) / augments.length
    for (var i = 0; i < augments.length; i++)
    {
        const augIndex = i
        const aug = augments[i]
        var text = [aug.augmentName, ""]
        {
            // account for enters (\n)
            var str = ""
            for (var j = 0; j < aug.augmentDescription.length; j++)
                if (aug.augmentDescription[j] != '\n')
                    str += aug.augmentDescription[j]
                else
                {
                    text.push(str)
                    str = ""
                }
            if (str.length > 0)
                text.push(str)
        }
        text.push("")
        // show a list of effected spells
        text.push("Effected spells:")
        for (var j = 0; j < aug.augmentsEffected.length; j++)
            text.push(aug.augmentsEffected[j])

        const x = btnPaddingW + i * widthWithoutPadding
        const y = btnPaddingY
        augmentsUIButtons.push(addUI(x, y, 
            btnWidth, btnHeight, 
            text, ()=> {
                selectedAugmentIndex = augIndex
                fixAugmentsUIButtonHighlight()
                draw()
            }))
    }
    fixAugmentsUIButtonHighlight()
    const confirmAugmentBtnWidth = .25

    augmentsUIButtons.push(addUI(.5 - (confirmAugmentBtnWidth / 2), 1 - btnPaddingY - confirmAugmentBtnHeight, 
                                confirmAugmentBtnWidth, confirmAugmentBtnHeight, 
                                "Confirm choice", confirmAugmentChoice))
}

function confirmAugmentChoice()
{
    if (selectedAugmentIndex >= 0 && selectedAugmentIndex < augmentsYouCanChoose.length)
    {
        doAction(ActionPacketType.selectAugment, selectedAugmentIndex)
        selectedAugmentIndex = -1
        showRemainingAugmentTime()
        draw()
    }
}

function fixAugmentsUIButtonHighlight()
{
    const highlightColor = "rgb(25, 75, 25)"
    const normalColor = "rgb(0, 0, 0)"
    for (var i = 0; i < augmentsUIButtons.length; i++)
        augmentsUIButtons[i].backgroundColor = i == selectedAugmentIndex ? highlightColor : normalColor
    augmentsUIButtons[augmentsUIButtons.length - 1].backgroundColor = selectedAugmentIndex == -1 ? normalColor : highlightColor
}

function showRemainingAugmentTime()
{
    for (var i = 0; i < augmentsUIButtons.length; i++)
        removeUI(augmentsUIButtons[i])
    augmentsUIButtons = []
    const w = .2
    const h = .1

    augmentsUIButtons.push(addUI(.5 - (w / 2), .5 - (h / 2), 
                                w, h, 
                                "Time until resuming: " + augmentTimeRemaining))
}

function clearAugmentsUIButtons()
{
    for (var i = 0; i < augmentsUIButtons.length; i++)
        removeUI(augmentsUIButtons[i])
    augmentsUIButtons = []
}

function endAugmentPhase()
{
    if (augmentsYouCanChoose == null)
        return
    clearAugmentsUIButtons()
    augmentsYouCanChoose = null
}