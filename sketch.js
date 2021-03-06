/**
 *  @author kiwi
 *  @date 2022.05.22
 *
 *
 *  ☒ display 7 mana symbols
 *  ☒ toggle mana symbol highlight with keyboard input: cwubrg
 *      clean up
 *  ☒ see mana font css to get correct colors
 *      c: beb9b2
 *      w: f0f2c0
 *      u: b5cde3
 *      b: aca29a
 *      r: db8664
 *      g: 93b483
 *  ☒ add JSON
 *  ☒ extract tricks
 *  ☒ color filtering tricks
 *  ☒ add JSON pagination
 *
 *  → warm welcome, swooping protector, refuse to yield not showing up
 *  → quick-draw dagger not showing up for colors
 *
 *  ☐ add sound effects for adding and resetting mana
 *  ☐ opponent available mana! → plan algorithm
 *      add to mana via wubrg, reset to zero with WUBRG
 *      visualize as rectangular 'stack' above each icon's square border
 *      see 17LandsArenaUI → ✒
 *      card scrolling or card wrap
 *      mouseover
 *
 *  ☐ display card art
 *  ☐ card title overlay
 *  ☐ card wrap
 *  ☐
 */

let consolas, meiryo
let instructions
let debugCorner /* output debug text in the bottom left corner of the canvas */

const FONT_SIZE = 10 // this needs to be even. note: the font in-game is bold

let w, u, b, r, g, c, p
let strip /* color selector UI. a mana symbol is highlighted when selected */

let initialScryfallQueryJSON /* json file from scryfall: set=snc */
let cards /* packed up JSON data */
let tricksDataLastFrame /* helps check if we need to resort list */
let displayedTricks /* list of filtered combat tricks */
let scryfallData = [] /* scryfallQuery['data'] */
let lastRequestTime = 0
let loadedJSON = false /* flag is set to true once all pages in JSON load */

let manaColors

function preload() {
    consolas = loadFont('data/consola.ttf')
    meiryo = loadFont('data/meiryo.ttf')
    w = loadImage('svg/w.svg')
    u = loadImage('svg/u.svg')
    b = loadImage('svg/b.svg')
    r = loadImage('svg/r.svg')
    g = loadImage('svg/g.svg')
    p = loadImage('svg/p.svg')
    c = loadImage('svg/c.svg')

    let req = 'https://api.scryfall.com/cards/search?q=set:snc'

    /* this call to loadJSON finishes before sketch.setup() */
    initialScryfallQueryJSON = loadJSON(req)
}


function setup() {
    let cnv = createCanvas(800, 1500)
    cnv.parent('#canvas')
    colorMode(HSB, 360, 100, 100, 100)
    textFont(consolas, 14)
    imageMode(CENTER)
    rectMode(CENTER)

    lastRequestTime = millis()
    debugCorner = new CanvasDebugCorner(5)
    instructions = select('#ins')
    instructions.html(`<pre>
        [cwubrg] → toggle icon highlight; shift+ to untoggle
        numpad 1 → freeze sketch</pre>`)

    scryfallData = scryfallData.concat(initialScryfallQueryJSON['data'])
    // console.log(`data retrieved! ${initialScryfallQueryJSON['data'].length}`)
    // console.log(scryfallData.length)

    /* check for scryfall JSON having more pages, recursively callback if so */
    if (initialScryfallQueryJSON['has_more']) {
        let pageTwoJSONURL = initialScryfallQueryJSON['next_page']
        loadJSON(pageTwoJSONURL, gotData)
    }

    /* cards = getCardData() */
    manaColors = {
        'c': color(35,6,75),
        'w': color(62,31,95),
        'u': color(209,40,89),
        'b': color(27,10,67),
        'r': color(17,60,86),
        'g': color(100,40,71)
    }

    let icons = []
    icons.push(new colorIcon('c', c, manaColors['c']))
    icons.push(new colorIcon('w', w, manaColors['w']))
    icons.push(new colorIcon('u', u, manaColors['u']))
    icons.push(new colorIcon('b', b, manaColors['b']))
    icons.push(new colorIcon('r', r, manaColors['r']))
    icons.push(new colorIcon('g', g, manaColors['g']))

    strip = new ColorSelector(icons)
    displayedTricks = []
}


function draw() {
    background(234, 34, 24)

    if (loadedJSON) {
        strip.render()
    }

    /* display list of combat tricks; populate list with 'z' key */
    if (displayedTricks && displayedTricks.length > 0) {
        /* do we need to sort the tricks list? since tricks are pushed
           asynchronously to the tricks array due to image loading, we need
           to wait before we can sort:

           compare a simple 'hash' of tricks in displayedTricks last frame.
           if there's been any changes to the tricks array, sort. this
           results in a few extra sorts per populateTricks call
         */
        let tricksDataThisFrame = ''
        for (const trick of displayedTricks) {
            tricksDataThisFrame += trick.name
        }

        if (tricksDataThisFrame !== tricksDataLastFrame) {
            displayedTricks.sort(sortCardsByMV)
            console.log(`sorting! ${displayedTricks.length} tricks`)
        }

        tricksDataLastFrame = tricksDataThisFrame

        const y = 200
        const spacing = 5
        const tricksDisplayRightMargin = width

        let xPos = displayedTricks[0].scaleWidth * .75
        let yOffset = 0

        /** set position for tricks on canvas, then render */
        for (const i in displayedTricks) {
            let trick = displayedTricks[i]

            if (xPos + trick.scaleWidth / 2 >= tricksDisplayRightMargin) {
                xPos = displayedTricks[0].scaleWidth * .75
                yOffset += trick.scaleHeight + spacing
            }

            trick.setPos(xPos, y + yOffset)
            trick.render()
            xPos += trick.scaleWidth + spacing
        }
    }

    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 3)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 2)
    debugCorner.setText(`availableColorChs: ${strip.getAvailableColorChs()}`, 1)
    // debugCorner.setText(`selected: ${strip.getSelectedColorChars()}`, 0)
    debugCorner.render()

    if (frameCount >= 3000)
        noLoop()
}


/* callback from scryfall API:  */
function gotData(data) {
    console.log(`data retrieved! ${data['data'].length}`)
    console.log(`request time → ${millis() - lastRequestTime}`)
    lastRequestTime = millis()

    /* add all elements of returned JSON data to our current array */
    scryfallData = scryfallData.concat(data['data'])

    if (data['has_more']) {
        loadJSON(data['next_page'], gotData)
    } else {
        console.log(`total request time → ${millis()}`)
        console.log(`total data length: ${scryfallData.length}`)

        cards = getCardData()
        console.log(`cards loaded! → ${cards.length}`)
        loadedJSON = true
    }
}


function getCardData() {
    let results = []
    let data = scryfallData

    /* regex for detecting creatures and common/uncommon rarity */
    const rarity = new RegExp('(common|uncommon|rare|mythic)')

    let count = 0

    for (let key of data) {
        /* double-sided cards like lessons, vampires, MDFCs have card image
          data inside an array within card_faces. card_faces[0] always gives
          the front card */

        let frontFace, imgURIs

        if (key['card_faces']) {
            frontFace = key['card_faces'][0]
        } else {
            frontFace = key
        }

        imgURIs = frontFace['image_uris']

        /* filter for rarity */
        if (rarity.test(frontFace['rarity'])) {
            let cardData = {
                'name': frontFace['name'],
                'colors': frontFace['colors'],
                'cmc': frontFace['cmc'],
                'type_line': frontFace['type_line'],
                'oracle_text': frontFace['oracle_text'],
                'collector_number': int(frontFace['collector_number']),
                'art_crop_uri': imgURIs['art_crop'], /*626x457 ½ MB*/
                'normal_uri': imgURIs['normal'],
                'large_uri': imgURIs['large'],
                'png_uri': imgURIs['png'] /* 745x1040 */

                /* normal 488x680 64KB, large 672x936 100KB png 745x1040 1MB*/
            }

            // console.log(`${key['name']} → ${key['cmc']}`)
            // console.log(`${key['name']} → image_uris → ${imgURIs}`)

            results.push(cardData)
            count++
        }
    }
    return results
}


function mouseMoved() {
    debugCorner.setText(`mouse: ${mouseX}, ${mouseY}`, 4)

    if (displayedTricks) {

        debugCorner.setText(`hovering over: none`, 0)
        for (const trick of displayedTricks) {
            trick.detectHover()
        }
    }
}

function keyPressed() {
    /* stop sketch */
    if (keyCode === 97) { /* numpad 1 */
        noLoop()
        instructions.html(`<pre>
            sketch stopped</pre>`)
    }

    /** if our key is in the color dictionary, select the corresponding icon */
    const lowerCaseKey = key.toLowerCase()
    if (strip.getAvailableColorChs().includes(lowerCaseKey)) {
        if (lowerCaseKey === key) {
            strip.select(key)
            /* if it's the uppercase version of the key, deselect it */
        } else {
            strip.deSelect(lowerCaseKey)
        }
    }

    if (key === 'z') {
        populateTricks()
    }

    if (key === 'x') {
        // console.log(`sorting`)
        // displayedTricks.sort(sortCardsByMV)
    }
}


/** loads card data so we can display cards found that match mana */
function populateTricks() {
    /* instant / flash cards that satisfy color requirements */
    let filteredCards = []
    for (let card of cards) {

        /* check only the front face of the card
           TODO some instant speed interaction are on the back face. we'd need
           to iterate through every face! */

        // console.log(`${card['name']} → ${card['oracle_text']}`)
        if (card['oracle_text'].toLowerCase().includes('flash') ||
            card['type_line'] === 'Instant') {
            filteredCards.push(card)
        } else {
            // console.log(`did not include → ${card['name']}`)
        }
    }

    displayedTricks = [] /* reset displayedTricks */
    for (let card of filteredCards) {
        // console.log(`${trick.name}→${trick.colors}`)

        /* see if this trick's colors are all selected in the UI. e.g.
         * brokers charm requires w,u,g all to be selected */
        let allColorsSelected = true

        /* iterate through each of the trick's colors */
        for (let i in card['colors']) {
            let c = card['colors'][i].toLowerCase()
            if (!strip.getSelectedColorChars().includes(c))
                allColorsSelected = false
        }

        /* load image asynchronously if the trick satisfies mv requirements!
         * add to displayedTricks array when done loading */
        if (allColorsSelected) {
            // console.log(`${trick['name']}`)
            loadImage(card['art_crop_uri'], data => {
                    displayedTricks.push(
                        new Trick(card['name'], card['cmc'], data))
                })
        }
    }
}


function sortCardsByMV(a, b) {
    if (a['cmc'] === b['cmc']) {
        // console.log(`${a['name']}→${a['cmc']}, ${b['name']}→${b['cmc']}`)
        return 0
    } else
        return (a['cmc'] < b['cmc']) ? -1 : 1
}


/** 🧹 shows debugging info using text() 🧹 */
class CanvasDebugCorner {
    constructor(lines) {
        this.size = lines
        this.debugMsgList = [] /* initialize all elements to empty string */
        for (let i in lines)
            this.debugMsgList[i] = ''
    }

    setText(text, index) {
        if (index >= this.size) {
            this.debugMsgList[0] = `${index} ← index>${this.size} not supported`
        } else this.debugMsgList[index] = text
    }

    render() {
        textFont(consolas, 14)
        noStroke()

        const LEFT_MARGIN = 10
        const DEBUG_Y_OFFSET = height - 10 /* floor of debug corner */
        const LINE_SPACING = 2
        const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING

        /* semi-transparent background */
        fill(0, 0, 0, 50)
        rectMode(CORNERS)
        rect(
            0, height,
            width, DEBUG_Y_OFFSET - LINE_HEIGHT * this.debugMsgList.length
        )

        fill(0, 0, 100, 100) /* white */

        for (let index in this.debugMsgList) {
            const msg = this.debugMsgList[index]
            text(msg, LEFT_MARGIN, DEBUG_Y_OFFSET - LINE_HEIGHT * index)
        }
    }
}