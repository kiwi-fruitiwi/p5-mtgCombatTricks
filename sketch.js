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
 *  ☐ add sound effects for adding and reseting mana
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

let font
let instructions
let debugCorner /* output debug text in the bottom left corner of the canvas */

let w, u, b, r, g, c, p
let strip /* color selector UI. a mana symbol is highlighted when selected */

let initialScryfallQueryJSON /* json file from scryfall: set=snc */
let cards /* packed up JSON data */
let testTrick
let displayedTricks /* list of filtered combat tricks */
let scryfallData = [] /* scryfallQuery['data'] */
let lastRequestTime = 0
let loadedJSON = false /* flag is set to true once all pages in JSON load */


function preload() {
    font = loadFont('data/consola.ttf')
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
    let cnv = createCanvas(500, 600)
    cnv.parent('#canvas')
    colorMode(HSB, 360, 100, 100, 100)
    textFont(font, 14)
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
    let icons = []
    icons.push(new colorIcon('c', c, color(35,6,75)))
    icons.push(new colorIcon('w', w, color(62,31,95)))
    icons.push(new colorIcon('u', u, color(209,40,89)))
    icons.push(new colorIcon('b', b, color(27,10,67)))
    icons.push(new colorIcon('r', r, color(17,60,86)))
    icons.push(new colorIcon('g', g, color(100,40,71)))

    strip = new ColorSelector(icons)
    displayedTricks = []
}


function draw() {
    background(234, 34, 24)

    if (loadedJSON) {
        strip.render()
    }

    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 3)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 2)
    debugCorner.setText(`availableColorChs: ${strip.getAvailableColorChs()}`, 1)
    debugCorner.setText(`selected: ${strip.getSelectedColorChars()}`, 0)
    debugCorner.show()

    if (frameCount >= 3000)
        noLoop()

    /* display list of combat tricks; populate list with 'z' key */
    const y = 300
    const lMargin = 50
    const spacing = 5
    if (displayedTricks) {
        for (const i in displayedTricks) {
            let trick = displayedTricks[i]
            trick.render(i*(trick.scale+spacing)+lMargin, y)
        }
    }
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
        /* filter for rarity */
        let imgURIs
        if (key['image_uris']) {
            imgURIs = key['image_uris']
        } else {
            imgURIs = key['card_faces'][0]
        }


        if (rarity.test(key['rarity'])) {
            let cardData = {
                'name': key['name'],
                'colors': key['colors'],
                'cmc': key['cmc'],
                'type_line': key['type_line'],
                'oracle_text': key['oracle_text'],
                'collector_number': int(key['collector_number']),
                'art_crop_uri': imgURIs['art_crop'], /*626x457 ½ MB*/
                'normal_uri': imgURIs['normal'],
                'large_uri': imgURIs['large'],
                'png_uri': imgURIs['png'] /* 745x1040 */

                /* normal 488x680 64KB, large 672x936 100KB png 745x1040 1MB*/
            }

            // console.log(`${key['name']} → image_uris → ${imgURIs}`)

            results.push(cardData)
            count++
        }
    }
    return results
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
        console.log(testTrick)
    }
}


/** loads card data so we can display cards found that match mana */
function populateTricks() {
    /* instant / flash cards that satisfy color requirements */
    let tricks = []
    for (let card of cards) {
        if (card['oracle_text'].toLowerCase().includes('flash') ||
            card['type_line'] === 'Instant') {
            tricks.push(card)
        } else {
            // console.log(`did not include → ${card['name']}`)
        }
    }

    let results = [] /* tricks that satisfy selected colors in UI */

    for (let trick of tricks) {
        // console.log(`${trick.name}→${trick.colors}`)

        /* see if this trick's colors are all selected in the UI. e.g.
         * brokers charm requires w,u,g all to be selected */
        let allColorsSelected = true

        /* iterate through each of the trick's colors */
        for (let i in trick['colors']) {
            let c = trick['colors'][i].toLowerCase()
            if (!strip.getSelectedColorChars().includes(c))
                allColorsSelected = false
        }

        let t = new Trick(trick['name'], trick['art_crop_uri'])

        if (allColorsSelected)
            results.push(t)
    }

    console.log(results)
    displayedTricks = results
}


/** one card to display in our list of tricks */
class Trick {
    constructor(name, imgURL) {
        this.name = name
        this.artCrop = loadImage(imgURL)
        this.scale = 75
    }

    render(x, y) {
        const w = this.scale
        const h = this.scale*457/626

        /* art crops are 626x457, ½ MB */
        tint(0, 0, 80)
        image(this.artCrop, x, y, w, h)

        noFill()
        stroke(0, 0, 80)
        strokeWeight(1)
        rect(x, y, w, h)
    }
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

    show() {
        textFont(font, 14)
        strokeWeight(1)

        const LEFT_MARGIN = 10
        const DEBUG_Y_OFFSET = height - 10 /* floor of debug corner */
        const LINE_SPACING = 2
        const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING
        fill(0, 0, 100, 100) /* white */
        strokeWeight(0)

        for (let index in this.debugMsgList) {
            const msg = this.debugMsgList[index]
            text(msg, LEFT_MARGIN, DEBUG_Y_OFFSET - LINE_HEIGHT * index)
        }
    }
}