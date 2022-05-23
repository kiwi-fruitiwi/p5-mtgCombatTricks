const LEFT_MARGIN = 60
const TOP_MARGIN = 150 /* canvasHeight ÷ 2 ideally */
const IMG_WIDTH = 50
const PADDING = 20

const SELECTED_ALPHA = 80
const DESELECTED_ALPHA = 40

/** a list of svg icons that can be toggled on and off in the UI
 */
class ColorStrip {
    constructor(imgList) {
        this.imgList = imgList
        this.colorDict = {
            'c': 0,
            'w': 1,
            'u': 2,
            'b': 3,
            'r': 4,
            'g': 5,
        }

        this.selected = [] /* which colors/indices are 'selected'? */
        for (const [key, value] of Object.entries(this.colorDict)) {
            this.selected.push(false)
        }

        for (let svg of this.imgList) {
            svg.resize(IMG_WIDTH, 0)
        }
    }

    render() {
        imageMode(CENTER)
        rectMode(CENTER)
        ellipseMode(CENTER)


        strokeWeight(2)
        noFill()

        const RECT_PADDING = 12
        for (let i in this.imgList) {
            const selected = this.selected[i]

            let iconAlpha = DESELECTED_ALPHA

            if (selected)
                iconAlpha = SELECTED_ALPHA

            tint(0, 0, 100, iconAlpha)
            stroke(0, 0, 100, iconAlpha)

            const svg = this.imgList[i]
            image(svg, LEFT_MARGIN + i*(IMG_WIDTH+PADDING), TOP_MARGIN)

            rect(LEFT_MARGIN + i*(IMG_WIDTH+PADDING),
                TOP_MARGIN,
                IMG_WIDTH + RECT_PADDING,
                IMG_WIDTH + RECT_PADDING,
                8)

            // circle(LEFT_MARGIN + i*(IMG_WIDTH+PADDING),
            //     TOP_MARGIN,
            //     IMG_WIDTH*1.3)
        }
    }

    /* return list of colors that are selected */
    getSelectedColorChars() {
        let selectedColors = []
        for (const [key, value] of Object.entries(this.colorDict)) {
            if (this.selected[value])
            selectedColors.push(key)
        }

        return selectedColors
    }

    /*  */
    select(ch) {
        this.selected[this.colorDict[ch]] = true
    }

    deSelect(ch) {
        this.selected[this.colorDict[ch]] = false
    }
}