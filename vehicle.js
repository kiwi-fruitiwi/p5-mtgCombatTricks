/** steering behavior code taken from 🚂p5-textSteeringLiya
    vehicle class with
        steering behaviors: seek, flee, arrive, return
        default particle behaviors: edges, wrap, applyForce, update, render/show

    tasks 🌊
    ☐ clean up 🚂.tSL code. add comments
    ☐ add elements of Vehicle class to Trick: position first
    ☐ collision check for each Trick
    ☐ create highlight border upon checking tricksList for collision
 */
class Vehicle {
    constructor(x, y) {
        this.pos = new p5.Vector(random(width), random(height))
        // this.pos = createVector(x, y)
        this.vel = p5.Vector.random2D()
        this.acc = new p5.Vector()
        this.rOriginal = random(5, 28)
        this.r = this.rOriginal
        this.target = new p5.Vector(x, y)
        this.maxspeed = 5
        this.maxforce = 1
        this.hue = random(360)

        this.showText = true
    }


    /** makes vehicles bounce off edges */
    edges() {
        if (this.pos.x > width) {
            this.vel.x *= -1
            this.pos.x = width
        } else if (this.pos.x < 0) {
            this.pos.x = 0
            this.vel.x *= -1
        } else if (this.pos.y > height) {
            this.vel.y *= -1
            this.pos.y = height
        } else if (this.pos.y < 0) {
            this.pos.y = 0
            this.vel.y *= -1
        }
    }


    /** makes vehicles wrap around edges */
    wrap() {

        if (this.pos.x > width) {
            this.pos.x = 1
        } else if (this.pos.x < 0) {
            this.pos.x = width-1
        } else if (this.pos.y > height) {
            this.pos.y = 1
        } else if (this.pos.y < 0) {
            this.pos.y = height-1
        }
    }


    fleeFromMouse() {
        /* applies a fleeing behavior based on distance from mouse */
        let mouse = new p5.Vector(mouseX, mouseY)
        let flee = this.flee(mouse).mult(2)
        let distance = p5.Vector.sub(this.pos, mouse).mag()
        if (distance < 70) {
            this.applyForce(flee)
        }
    }


    /** applies arrival behavior, sending this vehicle to its 'home' */
    returnToTextOrigin() {
        let arrive = this.arrive(this.target)
        this.applyForce(arrive)
    }


    seek(target) {
        // this gives you a vector pointing from us to the target
        let desired = p5.Vector.sub(target, this.pos)
        desired.setMag(this.maxspeed)

        // steering = desired - current
        let steer = p5.Vector.sub(desired, this.vel)
        return steer.limit(this.maxforce)
    }


    flee(target) {
        return this.seek(target).mult(-1)
        // watch out! technically, we should probably multiply our
        // desired velocity by -1 first before limiting
    }


    // like seek, but we slow down as we approach our target :3
    arrive(target) {
        // this gives you a vector pointing from us to the target
        let desired = p5.Vector.sub(target, this.pos)

        // the distance between two points is the magnitude of the
        // vector from one to the other
        let distance = desired.mag()

        let speed = this.maxspeed
        if (distance < 100) {
            speed = map(distance, 0, 100, 0, this.maxspeed)
        }

        desired.setMag(speed)

        // steering = desired - current
        let steer = p5.Vector.sub(desired, this.vel)
        return steer.limit(this.maxforce)
    }


    applyForce(f) {
        // F=ma, but we assume m=1, so F=a
        this.acc.add(f)
        this.acc.limit(this.maxforce)
    }


    update() {
        this.pos.add(this.vel)
        this.vel.add(this.acc)
        this.vel.limit(this.maxspeed)
        this.vel.mult(0.99)
        this.acc.mult(0)
    }


    show() {
        stroke(this.hue, 100, 100, 100)
        // strokeWeight(2)
        // point(this.pos.x, this.pos.y)
        //noStroke()

        fill(this.hue, 100, 100, 75)
        circle(this.pos.x, this.pos.y, this.r*2)

        textSize(this.r)

        fill(0, 0, 100)
        if (this.showText)
            // text('2', this.pos.x, this.pos.y)

        if (this.r > this.rOriginal) {
            this.r *= 0.9
        }
    }
}