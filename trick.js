/** one card to display in our list of tricks */
class Trick {
    constructor(name, cmc, img) {
        this.name = name
        this.cmc = cmc
        this.artCrop = img
        this.scaleWidth = 150
        this.scaleHeight = this.scaleWidth * 457/626
        this.opacity = 100

        this.artCrop.resize(this.scaleWidth, 0)
    }

    render(x, y) {
        const FONT_SIZE = 10
        textFont(meiryo, FONT_SIZE)

        tint(0, 0, this.opacity)

        /* art crops are 626x457, ½ MB */
        image(this.artCrop, x, y)

        /* art border */
        noFill()
        stroke(0, 0, this.opacity)
        strokeWeight(1)
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
        stroke(0, 0, 100)
        rect(BOX_BLC.x, BOX_BLC.y, BOX_TRC.x, BOX_TRC.y)

        /* cardName */
        strokeWeight(0.5)
        fill(0, 0, 100)
        text(this.name, BLC.x+TEXT_PADDING, BLC.y-TEXT_PADDING)
    }
}