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

    constructor(name, mv, typeText, artCrop, imgURI) {
        this.name = name
        this.mv = mv
        this.typeText = typeText /* magicalTyperC oracle text, title, mv, etc */
        this.artCrop = artCrop /* the actual cropped art image, not URL */
        this.cardImg = loadImage(imgURI) /* full image */
        this.scaleWidth = 150
        this.scaleHeight = this.scaleWidth * 457/626 /* artCrop scale factor*/
        this.unselectedOpacity = 20
        this.selectedOpacity = 100

        this.pos = new p5.Vector(0, 0)

        this.artCrop.resize(this.scaleWidth, 0)
        this.selected = false /* is the mouse hovering over me? */
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
            debugCorner.setText(`hovering over: ${this.name}`, 2)
            this.selected = true
        } else {
            this.selected = false
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

    getPosition() {
        return this.pos
    }

    /* finds the difference between two coordinates */
    #dist1D(a, b) {
        return abs(a-b)
    }

    render() {
        const x = this.pos.x
        const y = this.pos.y

        const FONT_SIZE = 10
        textFont(variableWidthFont, FONT_SIZE)

        tint(0, 0, 100)

        /* art crops are 626x457, ½ MB */
        image(this.artCrop, x, y)

        /* art border */
        noFill()

        this.#setSelectionStroke() /* sets opacity of border */
        strokeWeight(2)
        rectMode(CENTER)
        rect(x, y, this.scaleWidth, this.scaleHeight)

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
        stroke(0, 0, 100, this.selected?
            this.selectedOpacity: this.unselectedOpacity)

    }
}