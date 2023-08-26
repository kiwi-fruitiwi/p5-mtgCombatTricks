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
let necessaryCanvasHeight = 400
let lastSortTime = 0

let setName = 'woe'
let loadJsonFromCache = true
let saveScryfallJson = false /* saves loaded JSON after scryfall query */

let combineSecondSet = false
let secondSetName = 'mat'


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
}

function setup() {
    let cnv = createCanvas(1000, necessaryCanvasHeight)
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
    const setsWithBgs = ['bro', 'one', 'mom', 'ltr', 'woe']
    if (setsWithBgs.includes(setName))
        populateWallpapers()
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
        ]
    }

    const setImgArr = wallpapers[setName]

    /* use the array length as a scaling factor for random's [0,1) generator */
    const randomIndex = Math.floor(Math.random() * setImgArr.length)
    const wallpaperFileName = setImgArr[randomIndex];

    const bgURL = `url("backgrounds/${setName}/${wallpaperFileName}")`
    select('body').style('background-image', 'linear-gradient(rgba(0,0,0,0.4),' +
        ` rgba(0,0,0,0.4)), ${bgURL}`)
}


/**
 *  returns the reduced mana cost of a 🔑 cmc key value from scryfall JSON.
 *  note we need "this spell costs" AND "less to cast", otherwise cards like
 *  Mindsplice Apparatus will be included in cost reduction
 *
 *  examples:
 *      {3}{W}{W}   → 2         plated onslaught
 *      {2}{R}      → 1         rebel salvo
 *      {1}{U}      → 1         machine over matter
 *      {4}{B}      → 1         overwhelming remorse
 *  @param {string} manaCost
 *  @param {boolean} includeGeneric includes generic casting cost
 *      {3}{W}{W}   → 5
 */
function reduceMV(manaCost, includeGeneric=false) {
    /*  we're guaranteed every mana value is within {}

        ☒ string-builder to add a space after each }
        ☒ use string.split to create array of {} values?
        ☒ strip opening and closing brackets
        ☒ remove all integer elements using isNaN
        ☒ count the remaining elements → that's our mv!
     */
    let spacesAdded = ''
    for (const character of manaCost) {
        switch (character) {
            case '{':
                /* skip this character */
                break
            case '}':
                /* skip this character but add a space */
                spacesAdded += ' '
                break
            default:
                spacesAdded += character
        }
    }

    /* we need to call trim to remove the trailing space
        otherwise it actually counts as an empty array element for split
     */
    let manaList = spacesAdded.trim().split(' ')

    let result = []
    let generic = 0
    for (const element of manaList) {
        if (['W', 'U', 'B', 'R', 'G'].includes(element))
        // if (isNaN(element)) /* isNaN returns true if it's not a number */
            result.push(element)
        else if (includeGeneric)
            generic = element
    }

    return result.length + int(generic)
}


function changeCanvasSize(newHeight) {
    resizeCanvas(width, newHeight, false);
    console.log(`resized canvas to ${width}, ${newHeight}`)
}


function displayCombatTricks() {
    /* display list of combat tricks; populate list with 'z' key */
    if (displayedTricks && displayedTricks.length > 0) {
        /* do we need to sort the tricks list? since tricks are pushed
           asynchronously to the tricks array due to image loading, we need
           to wait before we can sort:

           compare a simple 'hash' of tricks in displayedTricks last frame.
           if there's been any changes to the tricks array, sort. this
           results in a few extra sorts per populateTricks call

           alternatively, we could wait 50ms between each sort too.

           but all of this above is taken care of by wrapTricksByMv now that
            wrapTricksByCard is obsolete.
         */
        let newCanvasHeight = wrapTricksByMv() /* wrapTricksByCard() */
        if (newCanvasHeight !== necessaryCanvasHeight) {
            changeCanvasSize(newCanvasHeight)
            necessaryCanvasHeight = newCanvasHeight
        }
    }

    /* show full size card image when mouse is clicked on a trick */
    if (clickedImg) {
        setDcShadow()
        image(
            clickedImg,
            width/2 - 10, /* 10 accounts for half the scrollbar width */
            windowHeight/2 + window.scrollY - 30, /* make sure not too low */
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
function wrapTricksByMv() {
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
    return Y + yOffset - CARD_HEIGHT/2 - SPACING/2 - DIVIDER_HEIGHT
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


function draw() {
    clear()
    background(234, 34, 24, 50)


    if (loadedJSON) {
        colorBar.render()
    }

    displayCombatTricks()

    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 1)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 0)
    debugCorner.showTop()

    if (frameCount > 30000) /* stop refreshing the screen after 30⌚ */
        noLoop()
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
    console.log(`${cards.length} cached card faces loaded: ${setName}`)
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

    console.log(`💦 [scryfall JSON size] ${data.length}`)

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
                    imgURIs = element['card_faces'][i]['imgURIs']

                /* amend face with needed information from main card */
                face['colors'] = element['colors']
                face['collector_number'] = element['collector_number']
                face['keywords'] = element['keywords']
                face['rarity'] = element['rarity']

                /* TODO tinker with generating cmc from mana_cost */
                face['cmc'] = reduceMV(face['mana_cost'], includeGeneric = true)
                console.log(`🥝 ${face['name']} → cmc:${face['cmc']}`)

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

/* returns true if a card satisfies the requirements of a trick */
function isTrick(jsonElement) {
    return true
}

/* some cards have multiple faces, so we use the front for now */
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


/** loads card data so we can display cards found that match mana */
function populateTricks() {
    console.log('🐳 populating tricks')

    /* instant / flash cards that satisfy color requirements */
    let filteredCards = []
    for (let card of cards) {
        /* check only the front face of the card
           TODO some instant speed interaction are on the back face. to
             handle this, we'd to iterate through every face! */

        if (card['keywords'].includes('Flash') ||
            card['type_line'].includes('Instant')) {

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
                    /* basic lands start at 262, end at 281 */
                    if (card['collector_number'] <= 281)
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