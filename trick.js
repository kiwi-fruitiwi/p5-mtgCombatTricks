const BORDER_RADIUS = 5
const FONT_SIZE = 10

const FULL_CARD_WIDTH_PX = 745
const FULL_CARD_HEIGHT_PX = 1040
const FULL_CARD_SCALE_FACTOR = 0.6

/** one card to display in our list of tricks */
class Trick {
    /*  each trick needs a position
        sketch.js sets positions instead of rendering at position
        then list of tricks call render
        once you have a position inside each Trick object, can check mouse
            check rect collision → if inside, highlighted=true, border!
                set global mouseover image to this.png → render
                if mouse out, set image to blank pixel or null
                    mouseover image only displays if (mouseOverImage)

        ↑ the above is the p5 canvas version of this project
        ↓ using CSS and HTML, we'd use a flexbox to lay out cards
            each Trick would put an item in the flexbox with an hover attribute
            hovers link to a card's pngUri
            use css:hover to make each appear
     */

    constructor(name, mv, typeText, borderCrop, pngURI) {
        this.name = name
        this.mv = mv
        this.typeText = typeText /* magicalTyperC oracle text, title, mv, etc */

        /* we used to asynchronously load this in populateTricks, but had
           duplicate Trick issues due to displayedTricks being modified during
           the callback, which can occur when another populateTricks call is
           executing */
        loadImage(borderCrop, data => {
            this.borderCrop = data
            this.borderCrop.resize(this.scaleWidth, 0)
        })

        loadImage(pngURI, data => {
            this.cardImg = data
            this.cardImg.resize(
                FULL_CARD_WIDTH_PX * FULL_CARD_SCALE_FACTOR,
                FULL_CARD_HEIGHT_PX * FULL_CARD_SCALE_FACTOR
            )
        }) /* asynchronous callback to load and resize the full png image */

        this.scaleWidth = 150 /* width of each card in the UI */

        /* artCrop scale factor is 457/626 */
        /* borderCrop scale factor is 680/480 */
        this.scaleHeight = this.scaleWidth * 680/480

        /* border stroke brightness and opacity when selected vs unselected */
        this.selectedBrightness = 20
        this.unSelectedBrightness = 15
        this.selectedOpacity = 100
        this.unselectedOpacity = 95

        this.pos = new p5.Vector(0, 0)

        this.hovered = false /* is the mouse hovering over me? */
    }

    setPos(x, y) {
        this.pos.x = x
        this.pos.y = y
    }

    /* returns true if mouse position is 'over' this Trick */
    #mouseCollisionDetected() {
        if ((this.#dist1D(mouseX, this.pos.x) < this.scaleWidth/2) &&
            (this.#dist1D(mouseY, this.pos.y) < this.scaleHeight/2)) {
            return true
        } else return false
    }

    /** if we're mousing over this trick, highlight us and set
        sketch.mouseOverImg */
    detectHover() {
        /* remember we're in CENTER rectMode! */
        if (this.#mouseCollisionDetected()) {
            // debugCorner.setText(`hovering over: ${this.name}`, 3)
            this.hovered = true
        } else {
            this.hovered = false
        }
    }

    detectClick() {
        /* remember we're in CENTER rectMode! */
        if (this.#mouseCollisionDetected()) {
            console.log(this.typeText)

            /* reset hoverImg probably not necessary after constructor
             loading of full card img; used to be loaded here */
            clickedImg = null
            clickedImg = this.cardImg
            clickedPos = this.pos
        }
    }

    /* finds the difference between two coordinates */
    #dist1D(a, b) {
        return abs(a-b)
    }

    render() {
        const x = this.pos.x
        const y = this.pos.y

        textFont(variableWidthFont, FONT_SIZE)

        /** vary tint depending on if the Trick is selected.
            currently 100 all the time

            slight highlight when selected:
            this.selected? this.selectedOpacity: this.unselectedOpacity
         */
        tint(0, 0, 100)

        /** add white glow if this Trick is selected */
        const MILK = color(207, 7, 99)

        if (this.hovered) {
            drawingContext.shadowBlur = 20
            drawingContext.shadowColor = MILK
        }

        /* art crops are 626x457, ½ MB */
        /* make sure borderCrop img has finished loading. it's okay if it
         hasn't! we just display nothing until it has. */
        if (this.borderCrop) {
            image(this.borderCrop, x, y)
            this.#resetDcShadow()

            /* art border */
            noFill()

            this.#setSelectionStroke() /* sets opacity of border */
            strokeWeight(6) /* card black border thickness */
            rectMode(CENTER)
            rect(x, y, this.scaleWidth, this.scaleHeight, BORDER_RADIUS)
        }

        /* this.#displayTextBox() */
    }


    #resetDcShadow() {
        drawingContext.shadowBlur = 0
        drawingContext.shadowOffsetY = 0
        drawingContext.shadowOffsetX = 0
    }

    #displayTextBox() {
        const x = this.pos.x
        const y = this.pos.y

        /*
        rectMode(CORNERS) interprets the first two parameters as the location
        of one of the corners, and the third and fourth parameters as the
        location of the diagonally opposite corner. Note, the rectangle is
        drawn between the coordinates, so it is not necessary that the first
        corner be the upper left corner.
         */

        /* our corners will be bottom left corner, top right corner */
        const TEXTBOX_MARGIN = 3
        const TEXT_PADDING = 6 /* space between text and artCrop border */

        const BLC = new p5.Vector(x-this.scaleWidth/2, y+this.scaleHeight/2)

        const BOX_BLC = new p5.Vector(
            BLC.x+TEXTBOX_MARGIN,
            BLC.y-TEXTBOX_MARGIN)

        const BOX_TRC = new p5.Vector(
            BLC.x+TEXT_PADDING*2 + textWidth(this.name),
            // BLC.y-TEXTBOX_MARGIN*2 - textAscent() - textDescent()
            /* textAscent and textDescent don't work for meiryo */
            BLC.y-TEXTBOX_MARGIN*2 - FONT_SIZE
        )

        /* textbox to surround cardName */
        rectMode(CORNERS)
        strokeWeight(1)
        fill(0, 0, 0, 50)

        this.#setSelectionStroke()
        rect(BOX_BLC.x, BOX_BLC.y, BOX_TRC.x, BOX_TRC.y)

        /* cardName */
        strokeWeight(0.5)
        fill(0, 0, 100)
        text(this.name, BLC.x+TEXT_PADDING, BLC.y-TEXT_PADDING)
    }

    toString() {
        return `${this.name}`
    }

    #setSelectionStroke() {
        stroke( /* hue, saturation, brightness, alpha */
            0,
            0,
            this.unSelectedBrightness,
            100)

        /* to vary by selection we can use this for brightness:
           this.selected? this.selectedBrightness: this.unSelectedBrightness */
    }
}