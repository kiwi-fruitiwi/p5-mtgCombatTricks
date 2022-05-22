const LEFT_MARGIN = 60
const TOP_MARGIN = 150 /* canvasHeight ÷ 2 ideally */
const IMG_WIDTH = 50
const PADDING = 32

/** a list of svg icons that can be toggled on and off in the UI
 */
class ColorStrip {
    constructor(imgList) {
        this.imgList = imgList
        this.toggle = []

        for (let svg of this.imgList) {
            svg.resize(IMG_WIDTH, 0)
            console.log(svg)
        }
    }

    render() {
        imageMode(CENTER)
        rectMode(CENTER)

        const RECT_PADDING = 12
        for (let i in this.imgList) {
            const svg = this.imgList[i]
            image(svg, LEFT_MARGIN + i*(IMG_WIDTH+PADDING), TOP_MARGIN)
            rect(LEFT_MARGIN + i*(IMG_WIDTH+PADDING),
                TOP_MARGIN,
                IMG_WIDTH + RECT_PADDING,
                IMG_WIDTH + RECT_PADDING,
                3)
        }
    }

    turnOn() {
        this.toggle = true
    }

    turnOff() {
        this.toggle = false
    }
}