
const TOP_MARGIN = 110 /* canvasHeight ÷ 2 ideally */
const IMG_WIDTH = 20 /* 50 */
const IMG_HEIGHT = 20 /* 50 */
const RECT_PADDING = 6 /* 12 */

const LEFT_MARGIN = 20
/* accounts for CENTER RectMode: x position of left-most colorIcon img center */
const ICON_XPOS = LEFT_MARGIN + IMG_WIDTH/2 + RECT_PADDING/2

const ICON_SPACING = 10 /* 20 space between icons. not padding, but spacing */
const STROKE_WEIGHT = 1

const SELECTED_ALPHA = 100
const DESELECTED_ALPHA = 20
const CIRCLE_DISPLAY = false


class colorIcon {
    constructor(colorCh, img, color_) {
        this.img = img /* svg image of this colorIcon */
        this.colorCh = colorCh /* WUBRGC */
        this.color = color_ /* p5 color object */
        this.highlighted = false /* if this colorIcon is selected, highlight! */
        this.count = 0 /* how many of pips of this color? */
        this.pos = new p5.Vector(0, 0) /* the CENTER coords of each icon */
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

    /* finds the difference between two coordinates */
    #dist1D(a, b) {
        return abs(a-b)
    }

    /* returns true if mouse position is 'over' this colorIcon */
    #mouseCollisionDetected() {
        const withinXBound = this.#dist1D(mouseX, this.pos.x) < IMG_WIDTH/2
        const withinYBound = this.#dist1D(mouseY, this.pos.y) < IMG_HEIGHT/2

        return withinXBound && withinYBound
    }

    /** detect if the mouse is currently hovering over this colorIcon
     */
    detectHover() {
        /* remember we're in CENTER rectMode! */
        if (this.#mouseCollisionDetected()) {
            debugCorner.setText(`hovering over: ${this.colorCh} colorIcon`, 2)
            this.highlighted = true
        } else {
            this.highlighted = false
        }
    }

    /**
     * render this colorIcon depending on its index inside colorSelector
     * draw indicators for mana count: rectangles above
     * @param index
     */
    render(index) {
        /* add color if moused over (highlighted) or selected (count > 0) */
        if (this.highlighted || this.count > 0) {
            tint(this.color, SELECTED_ALPHA)
            fill(0, 0, 100, 10)
            stroke(this.color, 80)
        } else { /* gray otherwise */
            noFill()
            tint(0, 0, 100, DESELECTED_ALPHA)
            stroke(0, 0, 100, DESELECTED_ALPHA)
        }

        this.pos.x = ICON_XPOS + index * (IMG_WIDTH+ICON_SPACING)
        this.pos.y = TOP_MARGIN

        strokeWeight(STROKE_WEIGHT)
        if (CIRCLE_DISPLAY) {
            circle(this.pos.x, this.pos.y, IMG_WIDTH * 1.3)
        } else {
            rect(this.pos.x, this.pos.y,
                IMG_WIDTH + RECT_PADDING,
                IMG_WIDTH + RECT_PADDING,
                2) /* rounded borders */
        }

        const svg = this.img
        image(svg, this.pos.x, this.pos.y)

        stroke(0, 0, 100)
        strokeWeight(2)

        /* debug display: center of icon */
        // point(this.pos.x, this.pos.y)

        this.#displayManaBars()
    }

    #displayManaBars() {
        /** add bar visualization for mana count above each mana icon */
        /* midpoint of icon border top */
        const iconTopBorderY = this.pos.y - IMG_HEIGHT/2 - RECT_PADDING/2

        /* color.levels returns RGBa */
        // const c = icon.color.levels; stroke(icon.color); strokeWeight(1.2)

        noStroke()
        const c = this.color
        fill(hue(c), saturation(c), brightness(c), 80)

        /* padding for mana symbol count bars above each icon */
        const barPadding = 2
        const barHeight = 3
        const firstBarOffSet = 1

        /* display bars above each icon */
        for (let i=1; i<= this.getManaCount(); i++) {
            /* note RECT_PADDING/2 is extra padding from image to rect
             border TODO draw center point */

            let yOffset = i * (barPadding + barHeight) -
                barHeight/2 + firstBarOffSet

            /* additional spacing for first bar */
            rect(this.pos.x,
                iconTopBorderY - yOffset,
                IMG_WIDTH + RECT_PADDING,
                barHeight,
                0)
        }
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
        imageMode(CENTER)
        rectMode(CENTER)
        ellipseMode(CENTER)
        noFill()

        /** iterate through icons, displaying each one */
        for (let i in this.icons) {
            const icon = this.icons[i]
            icon.render(i)
        }
    }

    getColorIcons() {
        return this.icons
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