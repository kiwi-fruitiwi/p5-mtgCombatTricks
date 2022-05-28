const LEFT_MARGIN = 60
const TOP_MARGIN = 150 /* canvasHeight ÷ 2 ideally */
const IMG_WIDTH = 50 /* 50 */
const PADDING = 20 /* 20 */
const RECT_PADDING = 12 /* 12 */
const STROKE_WEIGHT = 1

const SELECTED_ALPHA = 60
const DESELECTED_ALPHA = 20


class colorIcon {
    constructor(colorCh, img, color_) {
        this.img = img
        this.colorCh = colorCh
        this.color = color_
        this.selected = false

        this.count = 0
    }
}


/** a list of svg icons that can be toggled on and off in the UI
 */
class ColorSelector {
    constructor(colorIcons) {
        this.icons = colorIcons

        for (let colorIcon of this.icons) {
            colorIcon.img.resize(IMG_WIDTH, 0)
        }
    }

    render() {
        const CIRCLE_DISPLAY = false
        imageMode(CENTER)
        rectMode(CENTER)
        ellipseMode(CENTER)

        strokeWeight(STROKE_WEIGHT)
        noFill()

        for (let i in this.icons) {
            const icon = this.icons[i]
            const selected = icon.selected

            let iconAlpha = DESELECTED_ALPHA
            if (selected) {
                tint(icon.color, 100)
                fill(0, 0, 100, 10)
                stroke(icon.color, 80)
            } else {
                noFill()
                tint(0, 0, 100, iconAlpha)
                stroke(0, 0, 100, iconAlpha)
            }

            if (CIRCLE_DISPLAY) {
                circle(LEFT_MARGIN + i * (IMG_WIDTH + PADDING),
                    TOP_MARGIN,
                    IMG_WIDTH * 1.3)
            } else {
                rect(LEFT_MARGIN + i*(IMG_WIDTH+PADDING),
                    TOP_MARGIN,
                    IMG_WIDTH + RECT_PADDING,
                    IMG_WIDTH + RECT_PADDING,
                    4)
            }

            const svg = icon.img
            image(svg, LEFT_MARGIN + i*(IMG_WIDTH+PADDING), TOP_MARGIN)

            /* add bar visualization for mana count above each mana icon */

        }
    }

    /* return list of colors that are selected */
    getSelectedColorChars() {
        let selectedColors = []
        for (const icon of this.icons) {
            if (icon.selected)
                selectedColors.push(icon.colorCh)
        }

        return selectedColors
    }

    getAvailableColorChs() {
        let result = []

        for (const icon of this.icons) {
            result.push(icon.colorCh)
        }
        return result
    }

    /* TODO make this work for list inputs */
    select(ch) { /* increase by 1 */
        for (const icon of this.icons) {
            if (icon.colorCh === ch) {
                icon.selected = true
            }
        }
    }

    deSelect(ch) { /* reset to 0 */
        for (let icon of this.icons) {
            if (icon.colorCh === ch) {
                icon.selected = false
            }

        }
    }
}