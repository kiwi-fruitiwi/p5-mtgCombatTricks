const LEFT_MARGIN = 50
const TOP_MARGIN = 120 /* canvasHeight ÷ 2 ideally */
const IMG_WIDTH = 20 /* 50 */
const ICON_SPACING = 10 /* 20 space between icons. not padding, but spacing */
const RECT_PADDING = 6 /* 12 */
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

    getManaCount() {
        return this.count
    }

    addManaCount() {
        this.count++
    }

    resetManaCount() {
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

        noFill()

        // noinspection JSSuspiciousNameCombination
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

            const iconX = LEFT_MARGIN + i * (IMG_WIDTH+ICON_SPACING)
            const iconY = TOP_MARGIN


            strokeWeight(STROKE_WEIGHT)
            if (CIRCLE_DISPLAY) {
                circle(iconX, iconY, IMG_WIDTH * 1.3)
            } else {
                rect(iconX, iconY,
                    IMG_WIDTH + RECT_PADDING,
                    IMG_WIDTH + RECT_PADDING,
                    2) /* rounded borders */
            }

            const svg = icon.img
            image(svg, LEFT_MARGIN + i*(IMG_WIDTH+ICON_SPACING), TOP_MARGIN)

            /* add bar visualization for mana count above each mana icon */

            /* display bars above each icon */
            const iconCenter = new p5.Vector(iconX, iconY)

            // noinspection JSSuspiciousNameCombination
            const imgHeight = IMG_WIDTH

            /* midpoint of icon border top */
            const iconTopBorderY = iconCenter.y - imgHeight/2 - RECT_PADDING/2

            /* color.levels returns RGBa */
            // const c = icon.color.levels
            const c = icon.color
            // stroke(icon.color)
            // strokeWeight(1.2)
            noStroke()
            fill(hue(c), saturation(c), brightness(c), 80)

            /* padding for mana symbol count bars above each icon */
            const barPadding = 2
            const barHeight = 3
            const firstBarOffSet = 1

            for (let i=1; i<= icon.getManaCount(); i++) {
                /* note RECT_PADDING/2 is extra padding from image to rect
                 border TODO draw center point */

                let yOffset = i * (barPadding + barHeight) -
                    barHeight/2 + firstBarOffSet

                /* additional spacing for first bar */

                rect(iconCenter.x,
                    iconTopBorderY - yOffset,
                    IMG_WIDTH + RECT_PADDING,
                    barHeight,
                    0)
            }
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
                if (icon.getManaCount() < 8) /* arbitrary limit */
                    icon.addManaCount()
                // console.log(icon.getManaCount())
                // console.log(hue(icon.color))
            }
        }
    }

    deSelect(ch) { /* reset to 0 */
        for (let icon of this.icons) {
            if (icon.colorCh === ch) {
                icon.selected = false
                icon.resetManaCount()
            }

        }
    }
}