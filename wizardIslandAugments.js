var augmentsYouCanChoose = null
var augmentsUIButtons = []
var selectedAugmentIndex = -1

function gotAugments(augments)
{
    if (augmentsYouCanChoose != null)
        return
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
        const text = [aug.augmentName, "", aug.augmentDescription]
        const x = btnPaddingW + i * widthWithoutPadding
        const y = btnPaddingY//.5 - btnHeight / 2
        augmentsUIButtons.push(addUI(x, y, 
            btnWidth, btnHeight, 
            text, ()=> {
                 selectedAugmentIndex = augIndex
                 fixAugmentsUIButtonHighlight()
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