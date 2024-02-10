/**
 *  @author kiwi
 *  @date 2022.05.22
 *  @ver2 2023.01.28
 *
 *  make each card a vehicle
 *      ☐ figure out how to use arrive behavior → implement
 *
 *  plan 'opponent available mana' algorithm
 *      🔗 diligence-dev.github.io/mtg_sirprise
 *
 *  ☐ add sound effects for adding and resetting mana
 */

let fixedWidthFont
let variableWidthFont
let instructions
let debugCorner /* output debug text in the bottom left corner of the canvas */

let w, u, b, r, g, c, p  /* svg images for WUBRG mana symbols + generic */
let colorBar /* color selector UI. a mana symbol is highlighted when selected */

let initialScryfallQueryJSON /* json file from scryfall: set=snc */
let cards /* packed up JSON data */
let tricksDataLastFrame /* helps check if we need to resort list */
let displayedTricks /* list of filtered combat tricks */

let scryfallData = [] /* scryfallQuery['data'] */
let lastRequestTime = 0
let loadedJSON = false /* flag is set to true once all pages in JSON load */

let manaColors /* js object of cwubrg char keys mapped to colors */
let clickedPos /* position of card that was last clicked on */
let clickedImg /* image of currently clicked card */

const FIXED_WIDTH_FONT_SIZE = 14

/* the canvas height needs to be large enough to show all the cards */
const CANVAS_MINIMUM_HEIGHT = 650
const CANVAS_STARTING_HEIGHT = 400  /* arbitrary value for looks */

let setName = 'mkm'
let secondSetName = 'wot'
let combineSecondSet = false

let loadJsonFromCache = true
let saveScryfallJson = false /* saves loaded JSON after scryfall query */


function preload() {
    fixedWidthFont = loadFont('data/consola.ttf')
    variableWidthFont = loadFont('data/meiryo.ttf')

    loadManaColorSVGs()

    if (loadJsonFromCache) {
        loadJSON(`json-cache/${setName}.json`, gotCachedData)
    } else {
        let req = `https://api.scryfall.com/cards/search?q=set:${setName}`

        /* if we're combining a second alchemy set, modify the scryfall query */
        if (combineSecondSet)
            req += `+OR+set:${secondSetName}`

        initialScryfallQueryJSON = loadJSON(req)
    }

    console.log(`flame javelin 🔥 {2/R}{2/R}{2/R} mv → ${reduceMV('{2/R}{2/R}{2/R}')}`)
}

function setup() {
    let cnv = createCanvas(1000, CANVAS_STARTING_HEIGHT)
    cnv.parent('#canvas')
    colorMode(HSB, 360, 100, 100, 100)
    textFont(fixedWidthFont, FIXED_WIDTH_FONT_SIZE)
    imageMode(CENTER)
    rectMode(CENTER)

    lastRequestTime = millis()
    debugCorner = new CanvasDebugCorner(5)
    instructions = select('#ins')
    instructions.html(`<pre>
        [cwubrg] → toggle colors
        numpad 1 → freeze sketch</pre>`)

    /** if we didn't load from cache, load from scryfall API. requires
     *  recursion if set has more than 175 cards in it. 175 is the maximum
     *  length of one scryfall request page */
    if (!loadJsonFromCache) {
        scryfallData = initialScryfallQueryJSON['data']
        console.log(`data retrieved! ${initialScryfallQueryJSON['data'].length}`)
        console.log(scryfallData.length)

        /* check for scryfall JSON having more pages, recursively execute
         callbacks if so */
        if (initialScryfallQueryJSON['has_more']) {
            let pageTwoJSONURL = initialScryfallQueryJSON['next_page']
            loadJSON(pageTwoJSONURL, gotData)
        }
    }

    displayedTricks = []
    setupColorSelector()

    /* we need to manually keep the available backgrounds array updated */
    populateWallpapers()
}

function draw() {
    clear()
    background(234, 34, 24, 50)

    if (loadedJSON) {
        colorBar.render()
        displayCombatTricks()
    }

    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 1)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 0)
    debugCorner.showTop()

    if (frameCount > 300000) /* stop refreshing the screen after 300sw */
        noLoop()
}

/* load mana color symbols */
function loadManaColorSVGs () {
    w = loadImage('svg/w.svg')
    u = loadImage('svg/u.svg')
    b = loadImage('svg/b.svg')
    r = loadImage('svg/r.svg')
    g = loadImage('svg/g.svg')
    p = loadImage('svg/p.svg')
    c = loadImage('svg/c.svg')
}

/** instantiates color selector and its colors */
function setupColorSelector() {
    manaColors = { /* colors possibly from Andrew Gioia's Mana project */
        'c': color(35,6,75),
        'w': color(62,31,95),
        'u': color(209,40,89),
        'b': color(27,10,67),
        'r': color(17,60,86),
        'g': color(100,40,71)
    }

    let icons = [] /* a list of colorIcons: manaChar, svg, rgb */
    icons.push(new colorIcon('c', c, manaColors['c']))
    icons.push(new colorIcon('w', w, manaColors['w']))
    icons.push(new colorIcon('u', u, manaColors['u']))
    icons.push(new colorIcon('b', b, manaColors['b']))
    icons.push(new colorIcon('r', r, manaColors['r']))
    icons.push(new colorIcon('g', g, manaColors['g']))

    /* this is the UI element that tracks filter colors for combat tricks */
    colorBar = new ColorSelector(icons)
}

/** populate wallpaper images lists for each set
     create a list of wallpaper images for every set as we work on them:
        BRO, ONE, MOM
     wallpapers dictionary keyed by setName
     list values filled with local filenames
     concat with setName to generate URL for css background-image +gradient
     manually keep this list updated to mirror local file structure, file names
     randomly select an element of this list to load as the URL for style.css

     wallpapers can be retrieved from 🔗 mtgpics.com/set?set=n where n is:
     396 Brothers' War
     401 Brothers' War: Retro Artifacts
     406 Phyrexia: All Will Be One
     410 March of the Machine
     416 Lord of the Rings: Tales of Middle-Earth. regular: 281, all: 476
            ends at 271, then some special lands
            does not include Knight of the Keep 291, Goblin Assailant 295
     421 Wilds of Eldraine
            regular ends at 276
            262-266 are special full art lands
     430 Lost Caverns of Ixalan
            regular ends at 291
            287-291 are full art lands. note normal basics are later!
     437 Murders at Karlov Manor


 */
function populateWallpapers() {
    const wallpapers = {
        'bro': [
            'platoondispenser.jpg',
            'urzascommand.jpg',
            'zephyrsentinel.jpg',
            'awakenthewoods.jpg',
            'skitterbeambattalion.jpg'
        ],
        'one': [
            'bluesunstwilight.jpg',
            'ossification.jpg',
            'transplanttheorist.jpg',
            'whitesunstwilight.jpg'
        ],
        'mom': [
            'angelicintervention.jpg',
            'boonbringervalkyrie.jpg',
            'knighterrantofeos.jpg',
            'momentoftruth.jpg',
            'nornsinquisitor.jpg'
        ],
        'ltr': [
            'birthdayescape.jpg',
            'theshire.jpg',
            'andurilflameofthewest.jpg',
            'gandalfthegrey.jpg',
            'samwisegamgee.jpg',
            'doorsofdurin.jpg',
            'lastmarchoftheents.jpg',
            'stingtheglintingdagger.jpg',
            'thegreyhavens.jpg'
        ],
        'woe': [
            'eriette.jpg',
            'evolvingwilds.jpg',
            'kellan.jpg',
            'solitarysanctuary.jpg',
            'virtueofknowledge.jpg'
        ],
        'lci': [
            'huatli.jpg',
            'nicanzil.jpg',
            'ridgeline.jpg',
            'thunderhulk.jpg',
            'courtyard.jpg',
            'thecore.png',
            'kutzil.png',
            'infantry.png',
            'raptor.png',
            'quintorius.png',
            'puzzledoor.png',
            'okinec.png',
            'matzalantli.jpg',
        ],
        'mkm': [
            'deduce.jpg',
            'glass.jpg',
            'helix.jpg',
            'intrude.jpg',
            'kellan.jpg'
        ]
    }
    const setsWithBgs = Object.keys(wallpapers)
    if (setsWithBgs.includes(setName)) {
        const setImgArr = wallpapers[setName]

        /* use the array length as a scaling factor for random's [0,1) generator */
        const randomIndex = Math.floor(Math.random() * setImgArr.length)
        const wallpaperFileName = setImgArr[randomIndex];

        const bgURL = `url("backgrounds/${setName}/${wallpaperFileName}")`
        console.log(`🖼️ ${bgURL}`)
        select('body').style('background-image', 'linear-gradient(rgba(0,0,0,0.4),' +
            ` rgba(0,0,0,0.4)), ${bgURL}`)

    }
}

/**
 * from {2}{W}{U}, returns ['W', 'U']
 * @param manaCost the scryfall 🔑mana_cost value
 * @returns {array}
 */
function getColorsFromManaCost(manaCost) {
    /* strip out curly braces from 🔑mana_cost */
    let strippedManaCost = ''
    for (const character of manaCost) {
        switch (character) {
            case '{': /* skip this character */
                break
            case '}': /* skip this character but add a space */
                /* this space is used as a delimiter for splitting later */
                strippedManaCost += ' '
                break
            case '/': /* for hybrid costs like {1}{U/R}{U/R} */
                strippedManaCost += ' '
                break
            default:
                strippedManaCost += character
        }
    }

    /* trim to remove trailing space, then split by ' ' → list of wubrg chars */
    let manaList = strippedManaCost.trim().split(' ')
    let wubrgArray = []
    for (const element of manaList) {
        if (['W', 'U', 'B', 'R', 'G'].includes(element))
            wubrgArray.push(element)
    }

    /* remove duplicate colors which can be generated from hybrid colors */
    const uniqueColorsOnly = new Set(wubrgArray)
    return Array.from(uniqueColorsOnly)
}


/**
 *  returns the reduced mana cost of a 🔑 cmc key value from scryfall JSON.
 *
 *  examples:
 *      {3}{W}{W}   → 2         plated onslaught
 *      {2}{R}      → 1         rebel salvo
 *      {1}{U}      → 1         machine over matter
 *      {4}{B}      → 1         overwhelming remorse
 *  @param {string} manaCost
 *  @param {boolean} includeGeneric includes generic casting cost
 *      {3}{W}{W}   → 5         plated onslaught
 */
function reduceMV(manaCost, includeGeneric=false) {
    /*  we're guaranteed every mana value is within {}

        ☒ string-builder to add a space after each }
        ☒ use string.split to create array of {} values?
        ☒ strip opening and closing brackets
        ☒ remove all integer elements using isNaN
        ☒ count the remaining elements → that's our mv!

        TODO this does not handle {2/R} flame javelin type costs yet
     */

    /** mana cost delimited by ⎵ and stripped of '{' and '}' */
    let sanitizedManaCost = ''
    let hybridSymbolsDetected = 0

    for (const character of manaCost) {
        switch (character) {
            case '{':
                /* skip this character */
                break
            case '}':
                /* skip this character but add a space */
                sanitizedManaCost += ' '
                break
            case '/':

                /* add '/' detection counter in per-char case statement:
                    inc on detection, to be subtracted later
                    add space, for splitting later
                 */
                hybridSymbolsDetected += 1
                sanitizedManaCost += ' '
                break
            default:
                sanitizedManaCost += character
        }
    }

    /* we need to call trim to remove the trailing space
        otherwise it actually counts as an empty array element for split

        subtract '/' detection counter from final count
            this works out for {2/R}: 2+1 is counted, then mv is 2
            the rules state mv of {2/R} is the higher of the two values: 2
        add all non-wubrg integer values encountered. there should be only '2'
     */
    let manaList = sanitizedManaCost.trim().split(' ')

    let result = []
    let generic = 0
    for (const element of manaList) {
        if (['W', 'U', 'B', 'R', 'G'].includes(element)) {
            result.push(element)
        } else if (element === '2' && !includeGeneric) {
            /* looking specifically for '2' inside a hybrid symbol */
            console.log(`2️⃣ javelin-type {2/R} hybrid mana detected → ${element}`)
            generic += int(element)
        } else if (includeGeneric) {
            generic += int(element) /* guaranteed only leading generic value */
        }
    }

    /* result.length will equal the total number of mana symbols, which is what
        we're counting! this is added to the integer generic cost, and we sub-
        tract the number of hybrid symbols detected, e.g. {3}{U/G}{U/G} parses
        to 3 U G U G, which is 3 + 4, minus 2 for each '/', giving 5!

        TODO: probably does not work for phyrexian mana
     */
    return result.length + int(generic) - hybridSymbolsDetected
}


function changeCanvasHeight(targetHeight) {
    /*  if equal to starting canvas height, set it
            this is for canvas reset when nothing is selected
        otherwise if less than minimum height
            set it to minimum
        if greater than minimum:
            set to parameter height
     */

    /* if we're already at the same height, don't force a redraw */
    if (targetHeight !== height) {
        resizeCanvas(width, targetHeight, false)
        // console.log(`${targetHeight} ==? ${height}`)
        /* no idea why this doesn't work: modifying heights erases canvas

            if (targetHeight === CANVAS_STARTING_HEIGHT) {
                resizeCanvas(width, CANVAS_STARTING_HEIGHT, false)
            } else if (targetHeight <= CANVAS_MINIMUM_HEIGHT) {
                resizeCanvas(width, CANVAS_MINIMUM_HEIGHT, false)
            } else if (targetHeight > CANVAS_MINIMUM_HEIGHT) {
                resizeCanvas(width, targetHeight, false)
            }

        */
    }
}


/* called every draw loop */
function displayCombatTricks() {
    /* condition needed to make sure tricks are loaded */
    if (displayedTricks && displayedTricks.length > 0) {
        renderTricksByMv()
    } else if (displayedTricks.length === 0) {
        /* since we check for displayedTricks, we need a fail case
         * if it's not loaded or we deselected all colors */
        changeCanvasHeight(CANVAS_STARTING_HEIGHT)
    }

    /* show full size card image when mouse is clicked on a trick */
    if (clickedImg) {
        setDcShadow()
        image(
            clickedImg,
            width/2 - 10, /* 10 accounts for half the scrollbar width */
            windowHeight/2 + window.scrollY - 40, /* make sure not too low */
        )
        resetDcShadow()
    }
}


function setDcShadow() {
    /** add white glow */
    const MILK = color(207, 7, 99)
    drawingContext.shadowBlur = 20
    drawingContext.shadowColor = MILK
}

function resetDcShadow() {
    drawingContext.shadowBlur = 0
    drawingContext.shadowOffsetY = 0
    drawingContext.shadowOffsetX = 0
}


/** let's wrap by mv instead!
 *   obtain list of all mv values in displayedTricks
 *   find all unique values → print or set debugMsg
 *   for each ascending value, populate on that row by itself →wrap
 */
function renderTricksByMv() {
    /* starting y-position of first card, Rectmode: CENTER. default 240 */
    const TOP_MARGIN = 80
    const Y = TOP_MARGIN + displayedTricks[0].scaleHeight / 2
    const SPACING = 20 /* spacing between each displayed Trick + divider */
    const DIVIDER_HEIGHT = 12
    const CARD_HEIGHT = displayedTricks[0].scaleHeight

    /* recall Tricks render by RectMode(CENTER)! */
    const LEFT_MARGIN = 20
    const MV_START = 10
    const MV_RIGHT_MARGIN = 20
    const X_START = displayedTricks[0].scaleWidth / 2 + LEFT_MARGIN + MV_START
    let xPos = X_START
    let yOffset = 0

    /** create a list of unique ascending mana values of all cards */
    let manaValues = []
    for (const c of displayedTricks) {
        if ( !(manaValues.includes(c.mv)) ) {
            manaValues.push(c.mv)
        }
    }

    // manaValues = [...new Set(manaValues)]
    debugCorner.setText(manaValues.sort(), 3)

    for (const mv of manaValues) {
        /* add a rectangle separator after each mv */
        /* fill(0, 0, 0, 25) */
        fill(237, 37.3, 20, 50)
        strokeWeight(0)
        erase() /* use erase to create negative space instead */
        rect( /* remember we are RectMode(CENTER): x, y, w, h */
            width/2,
            Y + yOffset - CARD_HEIGHT/2 - SPACING/2 - DIVIDER_HEIGHT/2,
            width,
            DIVIDER_HEIGHT)
        noErase()

        /* add mv and update xPos based on current rectMode setting */
        textFont(fixedWidthFont, 50)
        // stroke(0, 0, 100, 25)
        fill(0, 0, 100, 40)
        strokeWeight(0)
        text(mv, MV_START, Y + yOffset)
        xPos += MV_RIGHT_MARGIN

        const TRICKS_DISPLAY_RIGHT_MARGIN = width - 20

        /* iterate through all tricks, displaying only those that are the
         current mv in this row */
        for (const trick of displayedTricks) {
            if (trick.mv === mv) {
                if (xPos + trick.scaleWidth / 2 >= TRICKS_DISPLAY_RIGHT_MARGIN) {
                    /* reset x position; this is a wrap without dividers
                     * ∴ there is no DIVIDER_HEIGHT term */
                    xPos = X_START + MV_RIGHT_MARGIN
                    yOffset += CARD_HEIGHT + SPACING
                }

                /* setPos, render, increase xPos */
                trick.setPos(xPos, Y + yOffset)
                trick.render()
                xPos += trick.scaleWidth + SPACING
            }
        }

        /* reset each row: xPos returns to original, y goes to new row */
        xPos = X_START
        yOffset += CARD_HEIGHT + SPACING + DIVIDER_HEIGHT
    }

    /* y-center of lowest card. note we added more yOffset after last loop
     * so we have to subtract some. see canvasHeight ✒️ drawingPad entry for
     * details */
    let canvasHeight = Y + yOffset - CARD_HEIGHT/2 - SPACING/2 - DIVIDER_HEIGHT

    // console.log(`🥭renderTricksByMv: ${canvasHeight}, ${height}`)
    changeCanvasHeight(canvasHeight)
}


/* deprecated: displays cards on the canvas, wrapping by card */
function wrapTricksByCard () {
    const y = 200
    const SPACING = 5 /* spacing between each displayed Trick */
    const TRICKS_DISPLAY_RIGHT_MARGIN = width

    /* recall Tricks render by RectMode(CENTER)! */
    const LEFT_MARGIN = 20
    const X_START = displayedTricks[0].scaleWidth / 2 + LEFT_MARGIN
    let xPos = X_START
    let yOffset = 0

    /** set position for tricks on canvas, then render */
    for (const i in displayedTricks) {
        let trick = displayedTricks[i]

        if (xPos + trick.scaleWidth / 2 >= TRICKS_DISPLAY_RIGHT_MARGIN) {
            /* reset x position */
            xPos = X_START
            yOffset += trick.scaleHeight + SPACING
        }

        trick.setPos(xPos, y + yOffset)
        trick.render()
        xPos += trick.scaleWidth + SPACING
    }
}


function windowResized() {
    // resizeCanvas(windowWidth-40, necessaryCanvasHeight);
}

function mouseMoved() {
    detectTrickHover()
    detectColorIconHover()
}


/** iterate through all displayedTricks to see if our mouse is hovering
 over any Trick
 */
function detectTrickHover() {
    if (displayedTricks && debugCorner) {
        debugCorner.setText(`hovering over: none`, 3)
        for (const trick of displayedTricks) {
            trick.detectHover()
        }
    }
}

/** iterate through all of colorBar's color icons to see if our mouse is
 *  hovering over any of them
 */
function detectColorIconHover() {
    if (colorBar && debugCorner) {
        debugCorner.setText(`hovering over: none`, 2)
        for (const colorIcon of colorBar.getColorIcons()) {
            colorIcon.detectHover()
        }
    }
}


function mouseReleased() {
    /* reset  */
    clickedImg = null
}

function mousePressed() {
    if (displayedTricks) {
        for (const trick of displayedTricks) {
            trick.detectClick()
        }
    }

    detectColorIconClick()
}

function detectColorIconClick() {
    for (const colorIcon of colorBar.getColorIcons()) {
        colorIcon.detectClick()
    }
}


/**
 * callback from scryfall API: add 'data' values to local variable
 * recursively calls itself until 🔑:has_more is false.
 */
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

        cards = getCardDataFromScryfallJSON(scryfallData)
        console.log(`cards loaded! → ${cards.length}`)
        loadedJSON = true

        /* TODO saveJSON call */
        if (saveScryfallJson)
            saveJSON(scryfallData, `${setName}.json`)
    }
}


/**
 * callback for loading cached data: gets around the "loadJSON never returns
 * array, only object, if no callback is used" issue, which results in
 * "object not iterable" error.
 *
 * populates global cards list from cached scryfall data.
 */
function gotCachedData(data) {
    cards = getCardDataFromScryfallJSON(data)

    if (combineSecondSet) {
        loadJSON(`json-cache/${secondSetName}.json`, gotSecondaryCachedData)
    } else {
        console.log(`${cards.length} cached card faces loaded: ${setName}`)
        loadedJSON = true
    }
}

function gotSecondaryCachedData(data) {
    for (const element of data) {
        // console.log(`🚂 ${element['set']}.${element['collector_number']}:
        // ${element['name']}`)
    }

    cards.concat(getCardDataFromScryfallJSON(data))
    console.log(`total ${cards.length} cached card faces loaded: ${secondSetName}`)
    loadedJSON = true
}

/**
 * takes card data: an element from the scryfall json, and returns relevant
 * fields for combatTricks
 * @param element either the entire card from scryfall json, or one face
 * from 🔑card_faces
 * @param imgURIs for Adventures, the image is part of the json card object
 * rather than the child card_face object because the art is shared! for MDFCs,
 * battles, werewolves, etc., each card_face has its own art because it's
 * the back of the card
 * @return object json containing all necessary information about a card face
 */
function processCardFace(element, imgURIs) {
    /** formatted text for magicalTyperC */
    let typeText = ''

    /** regex for testing if a card is a creature, i.e. has power, toughness */
    const creature = new RegExp('[Cc]reature|Vehicle')

    /* if mana value is 0, skip displaying the space for our typerC text */
    let manaCost = element['mana_cost']
    if (manaCost !== '')
        manaCost = ' ' + manaCost

    typeText = `${element.name}${manaCost}\n${element['type_line']}\n${element['oracle_text']}\n`
    /* sometimes p/t don't exist. check type */
    if (creature.test(element['type_line']))
        typeText += `${element['power']}/${element['toughness']}\n`
    /* we need whitespace at end for passage end detection to work */

    if (element['flavor_text'])
        typeText += `\n${element['flavor_text']}\n`
    else typeText += '\n'

    /* extra space makes user able to hit 'enter' at end */
    typeText += ' '
    let cardData = {
        'name': element['name'],
        'colors': element['colors'],

        /* keywords apply to both faces? see harried artisan */
        'keywords': element['keywords'],
        'rarity': element['rarity'],
        'type_line': element['type_line'],
        'oracle_text': element['oracle_text'],
        'collector_number': int(element['collector_number']),
        'typeText': typeText,
        'art_crop_uri': imgURIs['art_crop'], /* 626x457 ½ MB*/
        'small_uri': imgURIs['small'], /* 146x204 */
        'normal_uri': imgURIs['normal'], /* normal 488x680 64KB */
        'large_uri': imgURIs['large'], /* large 672x936 100KB */
        'border_crop_uri': imgURIs['border_crop'], /* 480x680 104KB */
        'png_uri': imgURIs['png'] /* png 745x1040 1MB */
    }

    /* handle any cost reductions for mana value */
    cardData['cmc'] = handleMvReductions(element)

    return cardData
}


/** populates card data list from scryfall. this is used in the callback
 *  function after scryfall data finishes loading completely as well as when
 *  loading directly from cache
 */
function getCardDataFromScryfallJSON(data) {
    let results = []

    console.log(`💦 [${data[0]['set_name']}] ${data.length}`)

    let cardCount = 0 /* counts cards that pass the filters, like rarity */
    let cardFaceCount = 0 /* counts adventures twice */

    let includeGeneric;
    for (let element of data) {
        /** object containing URLs for various image sizes and styles */
        let imgURIs

        /** double-sided cards like lessons, vampires, MDFCs have card image
         data inside an array within card_faces. card_faces[0] always gives
         the front card. e.g. Kazandu Mammoth from ZNR
         also applies to: battles
         */
        let doubleFaceCard = false

        /** adventures use 🔑card_faces, but both 'faces' share the same art */
        let facesShareArt = false

        /* iterate through card faces if they exist */
        if (element['card_faces']) {
            /** cards either share one image across all faces (adventures) or
             have a unique image per face. find out which and flag.
             note if element['image_uris'] exists here after the preceding
             🔑card_faces check, then that image is shared across all
             card faces: it must be an adventure! */
            if (element['image_uris']) {
                facesShareArt = true
            } else {
                /* card faces have unique images: battles, MDFCs, day / night */
                doubleFaceCard = true
            }

            /** iterate through multiple faces and process */
            for (let i in element['card_faces']) {
                let face = element['card_faces'][i]

                if (facesShareArt)
                    imgURIs = element['image_uris']
                else
                    imgURIs = element['card_faces'][i]['image_uris']

                /* amend face with needed information from main card */
                face['collector_number'] = element['collector_number']
                face['keywords'] = element['keywords']
                face['rarity'] = element['rarity']

                /* for double faced cards, 🔑manaCost of back face should
                    equal that of the front face, e.g. Idol of the Deep King 2R
                    and Sovereign's Macuahuitl */
                let adjustedManaCost = ''
                if (face['mana_cost'] === '')
                    adjustedManaCost = element['card_faces'][0]['mana_cost']
                else adjustedManaCost = face['mana_cost']

                face['colors'] = getColorsFromManaCost(face['mana_cost'])
                face['cmc'] = reduceMV(adjustedManaCost, includeGeneric = true)

                const mvc = getColorsFromManaCost(face['mana_cost'])
                console.log(`🐬 ${face['name']} → ${face['mana_cost']} → ${mvc} → ${face['cmc']}`)

                results.push(processCardFace(face, imgURIs))
                cardFaceCount += 1
            }
        } else {
            /* process single face */
            imgURIs = element['image_uris']
            results.push(processCardFace(element, imgURIs))
            cardCount += 1
        }
    }

    console.log(`🍆 [+single cards] ${cardCount}`)
    console.log(`🍆 [+card faces] ${cardFaceCount}`)
    return results
}

/**
 *  some cards have multiple faces, so we use the front for now
 *
 *  note we need "this spell costs" AND "less to cast", otherwise cards like
 *  Mindsplice Apparatus will be included in cost reduction
 *
 *  @return total mv of card after applying cost reductions like convoke and
 *  'this spell costs {n} less to cast'
 */
function handleMvReductions(card) {
    let oracleText = card['oracle_text'].toLowerCase()
    /** ®️ regex for cost reduction logic, e.g. in set:LTR

     Arwen's Gift: This spell costs {1} less to cast if
     Banish from Edoras: This spell costs {2} less to cast if
     Bitter Downfall: This spell costs {3} less to cast if
     Gwaihir the Windlord: This spell costs {2} less to cast as long as
     Balrog, Durin's Bane: This spell costs {1} less to cast for each
     */

    /* regex matching general case of cost reduction */
    let generalMvReduction = /this spell costs {(\d+)} less to cast/

    /**
     * regex expressions matching specific case: reduction by {n}
     * this spell costs {n} less to cast (if | as long as)
     *      {1}{U}      → 1         machine over matter
     *      {3}{B}      → 1         bitter downfall
     *      {4}{W}{U}   → 4         gwaihir the windlord
     *      {3}{U}      → 3         arwen's gift
     */
    let costsLessIf = /spell costs {(\d+)} less to cast if/
    let costsLessALA = /spell costs {(\d+)} less to cast as long as/

    /**
     * regex expression matching specific case: all but colored
     * this spell costs {n} less to cast for each: reduceMV
     *      {3}{W}{W}   → 2         plated onslaught
     *      {2}{R}      → 1         rebel salvo
     *      {1}{U}      → 1         machine over matter
     *      {4}{B}      → 1         overwhelming remorse
     */
    let costsOnlyColored = /spell costs {(\d+)} less to cast for each/

    /* does the cost reduction phrase  exist in oracle text? */
    let matches = match(oracleText, generalMvReduction)
    if (matches) {
        let name = card['name']
        let cmc = card['cmc'] /* not frontFace; cmc is based on entire card */
        let n = matches[1] /* e.g. bitter downfall discount is 3 */

        let matchesIf = match(oracleText, costsLessIf)
        let matchesAsLongAs = match(oracleText, costsLessALA)

        /** in scryfall JSON, there's a 🔑cmc:
         *   "mana_cost": "{2}{B}",
         *   "cmc": 3.0,
         *
         * in order to find the discounted mv, subtract {n} from cmc
         */

        if (matchesIf || matchesAsLongAs) {
            // console.log(`${name} → reduce by ${n}: ${cmc-n}`)
            return cmc - n
        }

        if (match(oracleText, costsOnlyColored)) {
            /* in 3WW, the generic component is 3. colored is 2 */
            let coloredPips = reduceMV(card['mana_cost'])
            // console.log(`${name} → reduce generic: ${coloredPips}`)
            return coloredPips
        }
    }

    /** handles convoke cards which will always register an mv of 0
     Cut Short (MOM) 2W → 0 if 'W' is selected
     Artistic Refusal (MOM) 4UU → 0 if 'U' selected

     if card's keywords include 'convoke':
        reduce MV to 0

     note keywords are capitalized as of 2023.Apr
     */
    if (card['keywords'].includes('Convoke')) {
        // console.log(`convoke: ${cardData['name']}`)
        return 0
    }

    return card['cmc']
}

/**
 * if our key is in the color dictionary, select the corresponding icon
 * this used to increment the count, while shift+WUBRG deselects
 */
function handleColorSelectorKeys(key) {
    const lowerCaseKey = key.toLowerCase()
    if (colorBar.getAvailableColorChs().includes(lowerCaseKey)) {
        if (lowerCaseKey === key) {
            colorBar.select(key)
            /* if it's the uppercase version of the key, deselect it */
        } else {
            colorBar.deSelect(lowerCaseKey)
        }
    }
}

/* toggle WUBRG+C using corresponding lowercase keys */
function toggleSelectedColor(key) {
    const lowerCaseKey = key.toLowerCase()
    if (colorBar.getAvailableColorChs().includes(lowerCaseKey)) {
        colorBar.toggleIconSelection(key)
        populateTricks()
    }
}

function keyPressed() {
    /* stop sketch */
    if (keyCode === 97) { /* numpad 1 */
        noLoop()
        instructions.html(`<pre>
            sketch stopped</pre>`)
    }

    if (key === '`') { /* toggle debug corner visibility */
        debugCorner.visible = !debugCorner.visible
        console.log(`debugCorner visibility set to ${debugCorner.visible}`)
    }

    /* handleColorSelectorKeys(key) */
    toggleSelectedColor(key)

    if (key === 'x') {
        // console.log(`sorting`)
        // displayedTricks.sort(sortCardsByMV)
        console.log(`${displayedTricks}: ${displayedTricks.length}`)

        let manaValues = []
        /** create a list of ascending mana values of all cards */
        for (const c of displayedTricks) {
            console.log(`${c.name}, ${c.mv}`)
            if ( !(manaValues.includes(c.mv)) ) {
                manaValues.push(c.mv)
                console.log(`pushing ${c.mv} from ${c.name}`)
            }
        }

        console.log(`${manaValues}`)
    }
}


/** loads card data, so we can display cards found that match mana
  * called each time we select or deselect a WUBRGC color. renderTricksByMv uses
  * this data to render the Tricks
  */
function populateTricks() {
    /* instant / flash cards that satisfy color requirements */
    let filteredCards = []
    for (let card of cards) {
        /* check only the front face of the card
            it's possible some instant speed interaction exists on the back
            face, but 🔑keywords applies to the entire card, not individual
            faces. to handle this, we also check the oracle text for 'Flash\n'.

            TODO isn't this redundant with keywords.includes('Flash') though?
         */
        if (card['keywords'].includes('Flash') && (!card['oracle_text'].includes('Flash\n')))
            console.log(`🫐${card['name']} includes Flash keyword but not oracle`)

        if (
            card['oracle_text'].includes('Flash\n') ||
            card['type_line'].includes('Instant') ||
            card['keywords'].includes('Disguise'))
        {

            /* sets these days have promos not part of the draft set
             * e.g. Rescue Retriever, ID 291 of 287 in BRO */
            switch (setName.toLowerCase()) {
                case 'bro':
                    if (card['collector_number'] <= 287)
                        filteredCards.push(card)
                    break;
                case 'one':
                    if (card['collector_number'] <= 271)
                        filteredCards.push(card)
                    break;
                case 'ltr':
                    if (card['collector_number'] <= 281)
                        filteredCards.push(card)
                    break;
                case 'woe':
                    if (card['collector_number'] <= 276)
                        filteredCards.push(card)
                    break;
                case 'lci':
                    if (card['collector_number'] <= 291)
                        filteredCards.push(card)
                    break;
                case 'mkm':
                    if (card['collector_number'] <= 286)
                        filteredCards.push(card)
                    break;
                default:
                    /* TODO this triggers 'flashback', so that's bad :P */
                    filteredCards.push(card)
            }
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
            if (!colorBar.getSelectedColorChars().includes(c))
                allColorsSelected = false
        }

        /* load image asynchronously if the trick satisfies mv requirements!
         * add to displayedTricks array when done loading */
        if (allColorsSelected) {
            displayedTricks.push(
                new Trick(
                    card['name'],
                    card['cmc'],
                    card['typeText'],
                    card['border_crop_uri'],
                    card['png_uri']))
        }
    }

    displayTrickMvs()
    console.log(`🐳 populated tricks: ${displayedTricks.length}`)
}

/* debug 🐬 method for investigating NaN values in Trick mvs: show the mv of
 * each Trick in displayedTricks
 */
function displayTrickMvs() {
    for (const trick of displayedTricks) {
        console.log(`${trick.name} → ${trick.mv}`)
    }
}

/* no longer used now that we don't use wrapTricksByCard; wrapTricksByMv
 takes care of 'sorting' by MV */
function sortCardsByMV(a, b) {
    if (a['cmc'] === b['cmc']) {
        // console.log(`${a['name']}→${a['cmc']}, ${b['name']}→${b['cmc']}`)
        return 0
    } else
        return (a['cmc'] < b['cmc']) ? -1 : 1
}


/** 🧹 shows debugging info using text() 🧹 */
class CanvasDebugCorner {

    /**
     * creates a new debugCorner with a set number of total visible lines
     * @param lines
     */
    constructor(lines) { /*  */
        this.visible = false
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

    showBottom() {
        if (this.visible) {
            noStroke()
            textFont(fixedWidthFont, 14)

            const LEFT_MARGIN = 10
            const DEBUG_Y_OFFSET = height - 10 /* floor of debug corner */
            const LINE_SPACING = 2
            const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING

            /* semi-transparent background */
            fill(0, 0, 0, 10)
            rectMode(CORNERS)
            const TOP_PADDING = 3 /* extra padding on top of the 1st line */
            rect(
                0,
                height,
                width,
                DEBUG_Y_OFFSET - LINE_HEIGHT * this.debugMsgList.length - TOP_PADDING
            )

            fill(0, 0, 100, 100) /* white */
            strokeWeight(0)

            for (let index in this.debugMsgList) {
                const msg = this.debugMsgList[index]
                text(msg, LEFT_MARGIN, DEBUG_Y_OFFSET - LINE_HEIGHT * index)
            }
        }
    }

    showTop() {
        if (this.visible) {
            noStroke()
            textFont(fixedWidthFont, 14)

            const LEFT_MARGIN = 10
            const TOP_PADDING = 3 /* extra padding on top of the 1st line */

            /* offset from top of canvas */
            const DEBUG_Y_OFFSET = textAscent() + TOP_PADDING
            const LINE_SPACING = 2
            const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING

            /* semi-transparent background, a console-like feel */
            fill(0, 0, 0, 10)
            rectMode(CORNERS)

            rect( /* x, y, w, h */
                0,
                0,
                width,
                DEBUG_Y_OFFSET + LINE_HEIGHT*this.debugMsgList.length/*-TOP_PADDING*/
            )

            fill(0, 0, 100, 100) /* white */
            strokeWeight(0)

            textAlign(LEFT)
            for (let i in this.debugMsgList) {
                const msg = this.debugMsgList[i]
                text(msg, LEFT_MARGIN, LINE_HEIGHT*i + DEBUG_Y_OFFSET)
            }
        }
    }
}