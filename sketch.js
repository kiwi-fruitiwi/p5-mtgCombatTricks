/**
 *  @author kiwi
 *  @date 2022.05.22
 *
 *
 *  ☒ display 7 mana symbols
 *  ☒ toggle mana symbol highlight with keyboard input: cwubrg
 *      clean up
 *  ☐ see mana font css to get correct colors
 *      c: beb9b2
 *      w: f0f2c0
 *      u: b5cde3
 *      b: aca29a
 *      r: db8664
 *      g: 93b483
 */

let font
let instructions
let debugCorner /* output debug text in the bottom left corner of the canvas */

let w, u, b, r, g, c, p
let strip


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
        [cwubrg] → toggle icon highlight; shift+ to untoggle
        numpad 1 → freeze sketch</pre>`)

    strip = new ColorStrip([c, w, u, b, r, g])
}


function draw() {
    background(234, 34, 24)

    strip.render()

    // stroke(89, 100, 100)
    // strokeWeight(3)
    // point(64, 64)
    // point(width/2, height/2)

    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 2)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 1)
    debugCorner.show()
}


function keyPressed() {
    /* stop sketch */
    if (keyCode === 97) { /* numpad 1 */
        noLoop()
        instructions.html(`<pre>
            sketch stopped</pre>`)
    }

    switch(key) {
        case 'c': strip.select(0); break
        case 'C': strip.deSelect(0); break
        case 'w': strip.select(1); break
        case 'W': strip.deSelect(1); break
        case 'u': strip.select(2); break
        case 'U': strip.deSelect(2); break
        case 'b': strip.select(3); break
        case 'B': strip.deSelect(3); break
        case 'r': strip.select(4); break
        case 'R': strip.deSelect(4); break
        case 'g': strip.select(5); break
        case 'G': strip.deSelect(5); break
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