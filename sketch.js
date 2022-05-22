/**
 *  @author kiwi
 *  @date 2022.05.22
 *
 *
 *  ☒ display 7 mana symbols
 */

let font
let instructions
let debugCorner /* output debug text in the bottom left corner of the canvas */

let w, u, b, r, g, c, p
let manaSymbols = []

const LEFT_MARGIN = 60
const TOP_MARGIN = 150 /* canvasHeight ÷ 2 ideally */
const IMG_WIDTH = 50
const PADDING = 32

function preload() {
    font = loadFont('data/consola.ttf')
    w = loadImage('svg/w.svg')
    u = loadImage('svg/u.svg')
    b = loadImage('svg/b.svg')
    r = loadImage('svg/r.svg')
    g = loadImage('svg/g.svg')
    p = loadImage('svg/p.svg')
    c = loadImage('svg/c.svg')
}


function setup() {
    let cnv = createCanvas(600, 300)
    cnv.parent('#canvas')
    colorMode(HSB, 360, 100, 100, 100)
    textFont(font, 14)
    imageMode(CENTER)
    rectMode(CENTER)

    debugCorner = new CanvasDebugCorner(5)
    instructions = select('#ins')
    instructions.html(`<pre>
        numpad 1 → freeze sketch</pre>`)

    manaSymbols.push(w, u, b, r, g)

    for (let svg of manaSymbols) {
        console.log(svg)
        svg.resize(IMG_WIDTH, 0)
    }
}


function draw() {
    background(234, 34, 24)

    tint(0, 0, 100, 60)
    stroke(0, 0, 100, 80)
    strokeWeight(1)
    noFill()

    const RECT_PADDING = 12
    for (let i in manaSymbols) {
        const svg = manaSymbols[i]
        image(svg, LEFT_MARGIN + i*(IMG_WIDTH+PADDING), TOP_MARGIN)
        rect(LEFT_MARGIN + i*(IMG_WIDTH+PADDING),
            TOP_MARGIN,
            IMG_WIDTH + RECT_PADDING,
            IMG_WIDTH + RECT_PADDING,
            3)
    }

    // stroke(89, 100, 100)
    // strokeWeight(3)
    // point(64, 64)
    // point(width/2, height/2)

    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 2)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 1)
    debugCorner.show()
}


function displayManaSymbols() {

}


function keyPressed() {
    /* stop sketch */
    if (keyCode === 97) { /* numpad 1 */
        noLoop()
        instructions.html(`<pre>
            sketch stopped</pre>`)
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