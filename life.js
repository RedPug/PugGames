const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = Math.min(window.innerWidth,window.innerHeight)*0.8
canvas.height = Math.min(window.innerWidth,window.innerHeight)*0.8

w = canvas.width
h = canvas.height

var fps = 60


function winToCan(x,y){
    let box = canvas.getBoundingClientRect()
    return {
        x: x - box.left * (canvas.width / box.width),
        y: y - box.top * (canvas.height / box.height)
    }
}

const hex = (r, g, b) => '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')

function sleep(millis)
{
    //return new Promise(resolve => setTimeout(resolve, ms));
    var date = new Date();
    var curDate = null;
    do { curDate = new Date(); }
    while(curDate-date < millis);
}

class Vector{
    constructor(x,y){
        this.x = x
        this.y = y
    }

    copy(){
        return new Vector(this.x,this.y)
    }

    static random(max_mag){
        let v = new Vector(Math.random()-0.5,Math.random()-0.5)
        v.setMag((Math.random()-.5)*2*max_mag)
        return v
    }

    get magnitude(){
        return Math.sqrt(this.x*this.x + this.y*this.y)
    }

    /** 
     * @param {Vector} vec vector to add
     */
    add(vec){
        return new Vector(this.x + vec.x, this.y + vec.y)
    }

    /** 
     * @param {Vector} vec vector to subtract
     */
    sub(vec){
        return new Vector(this.x - vec.x, this.y - vec.y)
    }

    neg(){
        return new Vector(-this.x,-this.y)
    }

    
    normalize(){
        let mag = Math.sqrt(this.x*this.x + this.y*this.y)
        return new Vector(this.x/mag, this.y/mag)
    }

    /** 
     * @param {number} mag magnitude to set
     */
    setMag(mag){
        this.normalize()
        this.x *= mag
        this.y *= mag
        return this
    }

    /** 
     * @param {number} num value to multiply the vector by
     */
    mult(num){
        return new Vector(this.x*num,this.y*num)
    }

    /** 
     * @param {number} num value to divide the vector by
     */
    div(num){
        return new Vector(this.x/num, this.y/num)
    }

    /** 
     * @param {Vector} vec vector to take the dot product with
     * @return dot product of this and vec
     */
    dot(vec){
        return this.x*vec.x + this.y*vec.y
    }

    /** 
     * @param {Vector} vec vector to take the wedge product with
     * @return cross product / wedge product of this and vec
     */
    wedge(vec){
        return this.x*vec.y - this.y*vec.x
    }
}

class Particle{
    static minX = 10
    static maxX = w-10
    static minY = 10
    static maxY = h-10

    /**
     * @param {Vector} pos
     * @param {Vector} vel
     * @param {number} mass
     */
    constructor(pos,vel,mass){
        this.pos = pos
        this.vel = vel
        this.mass = mass
        this.density = 1 //mass per unit of space
        this.intersecting = false
        let r = this.getRadius()
        this.detection_rect = new Rectangle(this.pos.x-r*32, this.pos.y-r*32, r*64, r*64)
    }

    draw(){
        if(this.intersecting){
            c.fillStyle = hex(255,255,255)
        }else{
            c.fillStyle = hex(128,0,0)
        }
        

        c.beginPath()
        c.arc(this.pos.x, this.pos.y, this.getRadius(), 0, 2*Math.PI)
        c.fill()

        //let r = this.getRadius()
        //c.strokeStyle = 'blue'
        //let rec = this.detection_rect
        //c.strokeRect(rec.x,rec.y,rec.w,rec.h)
    }

    /**
     * run on all particles before running tick(). This ensures that all particles are in the same position in time when things are calculated
     */
    updateLocation(){
        
        if(Number.isNaN(this.vel.x) || Number.isNaN(this.vel.y)){console.log('over here!')}
        this.pos = this.pos.add(this.vel)

        this.pos.x = Math.min(Math.max(this.pos.x,Particle.minX),Particle.maxX)
        this.pos.y = Math.min(Math.max(this.pos.y,Particle.minY),Particle.maxY)

        let r = this.getRadius()
        this.detection_rect = new Rectangle(this.pos.x-r*32, this.pos.y-r*32, r*64, r*64)
    }

    tick(tree){

        let r = this.getRadius()

        let items = tree.query(this.detection_rect)

        this.intersecting = false

        //let thing

        items.every(item => {
            if(item === this){return true}
            
            //if(((item.pos.x-this.pos.x)**2+(item.pos.y-this.pos.y)**2) <= (r + item.getRadius())**2){ //item touches this
            //    this.intersecting = true
            //    thing = item
            //    return false
            //}
            let vec = new Vector(item.pos.x-this.pos.x, item.pos.y-this.pos.y)

            if(((vec.x)**2 + (vec.y)**2) > (r*32)**2){return true}

            let d = vec.magnitude
            d = Math.max(d,r*3)

            //let f1 = vec.copy().normalize().mult(-.005*((500**2)/((Math.max(d,r)+5)**2)-300)) // attract
            //let f1 = vec.copy().normalize().mult((50/(d+5))*(-50/(d+5)+1))
            let barrier = 100
            let h = -80
            let f1 = vec.copy().normalize().mult(.5*((barrier-h)/(d-h))**6-.5*((barrier-h)/(d-h))**12)

            //let f2 = vec.copy().normalize().mult(-d/1000) // repel

            f1 = f1.mult(this.mass).mult(0.95)

            this.addForce(f1)
            item.addForce(f1.neg())

            return true
        })

        /*
        if(this.intersecting){
            let force = new Vector(thing.pos.x-this.pos.x, thing.pos.y-this.pos.y)

            force.normalize()

            force.mult(this.mass)

            force.mult(0.9) // loss due to heat

            force.neg()

            this.addForce(force)
        }
        */

        //bounce off borders

        if(this.pos.x-r <= Particle.minX){this.addForce(new Vector(-this.vel.x*this.mass, 0).mult(1.9))}
        if(this.pos.x+r >= Particle.maxX){this.addForce(new Vector(-this.vel.x*this.mass, 0).mult(1.9))}

        if(this.pos.y-r <= Particle.minY){this.addForce(new Vector(0,-this.vel.y*this.mass).mult(1.9))}
        if(this.pos.y+r >= Particle.maxY){this.addForce(new Vector(0,-this.vel.y*this.mass).mult(1.9))}


        this.addForce(new Vector(0,this.mass*0.1)) // gravity

        this.vel = this.vel.mult(0.99) // friction

        //console.log(this.pos,this.vel)
    }

    /**
     * 
     * @param {number} mass the amount of mass to add
     */
    addMass(mass){
        this.mass += mass
    }

    /**
     * 
     * @param {Vector} force Force to apply
     */
    addForce(force){
        if(this.mass == 0){console.log('div 0')}
        //if(force.magnitude < 0.001){console.log('smol force!')}
        if(force.magnitude > 10000){console.log('big force!'); force.setMag(10000)}
        if(!force instanceof Vector){console.log('not instance')}

        this.vel = this.vel.add(force.div(this.mass))
    }

    /**
     * @returns Radius of the particle
     */
    getRadius(){
        return Math.sqrt(this.rSquare())
    }

    /**
     * @returns Squared radius of the particle
     */
    rSquare(){
        return Math.abs(this.mass/this.density)
    }
}

class Rectangle{
    constructor(x,y,w,h){
        if(w < 0){w *= -1; x -= w}
        if(h < 0){h *= -1; y -= h}

        this.x = x
        this.y = y
        this.w = w
        this.h = h
    }

    contains(pos){
        let x = pos.x
        let y = pos.y
        return x >= this.x && y >= this.y && x <= this.x+this.w && y <= this.y+this.h
    }

    intersects(rect){
        return this.x <= rect.x+rect.w && this.x+this.w >= rect.x && this.y <= rect.y+rect.h && this.y+this.h >= rect.y
    }

    insideOf(rect){
        return rect.contains(this.x, this.y) && rect.contains(this.x+this.w, this.y) && rect.contains(this.x, this.y+this.h) && rect.contains(this.x+this.w, this.y+this.h)
    }
}

class QuadTree{

    /**
     * 
     * @param {number} cap 
     * @param {Rectangle} bounds 
     * @param {Quadtree | undefined} parent
     */
    constructor(cap, bounds, parent){
        this.objects = []
        this.cap = cap
        this.bounds = bounds
        this.hasChildren = false
        this.hasParent = parent instanceof QuadTree
        if(this.hasParent){
            this.parent = parent
        }
    }

    copy(){
        let t = new QuadTree(this.cap,this.bounds,this.parent)
        t.objects = this.objects
        t.hasChildren = this.hasChildren
        t.hasParent = this.hasParent

        return t
    }

    query(rect){
        let found = []
        if(!this.bounds.intersects(rect)){return found}

        if(this.hasChildren){
            found = found.concat(
                this.nw.query(rect), 
                this.ne.query(rect), 
                this.sw.query(rect), 
                this.se.query(rect)
            )
        }else{
            if(rect.contains(this.bounds) && false){ //if the tree area is completely within the search area, don't check through everything
                found = found.concat(this.objects)
            }else{
            this.objects.forEach(point => {
                if(rect.contains(point.pos)){
                    found.push(point)
                }
            })
            }
        }
        return found
    }

    tick(){

        //let clone = this.copy()
        //let total_energy = 0

        this.objects.forEach((item, index) => {
            //item.vel = new Vector((Math.random()-0.5)*5,(Math.random()-0.5)*5)
            
            if(!this.bounds.contains(item.pos)){
                //console.log(item.pos,item.vel)
                this.getRoot().addObject(item)
                this.objects.splice(index,1)
            }

            item.updateLocation()

            //total_energy += item.mass * item.vel.magnitude**2
        })

        //console.log(total_energy)

        this.objects.forEach((item) => {
            item.tick(this.getRoot())
        })

        if(this.objects.length > this.cap && !this.hasChildren){
            this.subDivide()
        }

        if(this.numObjects() <= this.cap && this.hasChildren){this.combine()}

        if(this.hasChildren){
            this.nw.tick(this.getRoot())
            this.ne.tick(this.getRoot())
            this.sw.tick(this.getRoot())
            this.se.tick(this.getRoot())
        }

        
    }

    getRoot(){
        let thing = this
        while(thing.hasParent){
            thing = thing.parent
        }
        return thing
    }

    numObjects(){
        if(!this.hasChildren){return this.objects.length}

        return this.nw.numObjects() + this.ne.numObjects() + this.sw.numObjects() + this.se.numObjects() + this.objects.length
    }

    combine(){
        if(!this.hasChildren){return}

        this.nw.combine()
        this.ne.combine()
        this.sw.combine()
        this.se.combine()

        let things = [].concat(this.nw.objects, this.ne.objects, this.sw.objects, this.se.objects)
        this.objects = things

        this.nw = null
        this.ne = null
        this.sw = null
        this.se = null

        this.hasChildren = false
    }

    subDivide(){

        if(this.hasChildren){return}

        this.nw = new QuadTree(this.cap, new Rectangle(this.bounds.x,this.bounds.y,this.bounds.w*.5,this.bounds.h*.5),this)

        this.ne = new QuadTree(this.cap, new Rectangle(this.bounds.x+this.bounds.w*0.5,this.bounds.y,this.bounds.w*.5,this.bounds.h*.5),this)

        this.sw = new QuadTree(this.cap, new Rectangle(this.bounds.x,this.bounds.y+this.bounds.h*0.5,this.bounds.w*.5,this.bounds.h*.5),this)

        this.se = new QuadTree(this.cap, new Rectangle(this.bounds.x+this.bounds.w*0.5,this.bounds.y+this.bounds.h*0.5,this.bounds.w*.5,this.bounds.h*.5),this)

        this.hasChildren = true

        this.objects.forEach( (element, index) => {
            this.addObject(element)
            //if(this.nw.bounds.contains(element.pos)){this.nw.addObject(element);return;}
            //if(this.ne.bounds.contains(element.pos)){this.ne.addObject(element);return;}
            //if(this.sw.bounds.contains(element.pos)){this.sw.addObject(element);return;}
            //if(this.se.bounds.contains(element.pos)){this.se.addObject(element);return;}
            //console.log('sad :(')
        })

        this.objects = []


    }

    /**
     * @param {Particle} obj 
     */
    addObject(obj){
        /*
        if(!this.bounds.contains(obj.pos)){
            console.log('mean :(',this);
            if(this != this.getRoot()){
                this.getRoot().addObject(obj)
            }
            console.log(obj)
            //throw TypeError
        }
        */

        if(this.hasChildren){
            if(this.nw.bounds.contains(obj.pos)){this.nw.addObject(obj)}
            else if(this.ne.bounds.contains(obj.pos)){this.ne.addObject(obj)}
            else if(this.sw.bounds.contains(obj.pos)){this.sw.addObject(obj)}
            else if(this.se.bounds.contains(obj.pos)){this.se.addObject(obj)}
        }else{
            this.objects.push(obj)
        }
    }

    draw(){
        c.strokeStyle = hex(100,0,100)
        c.strokeRect(this.bounds.x,this.bounds.y,this.bounds.w,this.bounds.h)

        if(!this.hasChildren){
            c.strokeStyle = 'font-size = 100px'
            c.strokeText(this.objects.length.toString(),this.bounds.x+this.bounds.w/2, this.bounds.y+this.bounds.h/2)
        }


        if(this.hasChildren){
            this.nw.draw()
            this.ne.draw()
            this.sw.draw()
            this.se.draw()
        }else{
            this.objects.forEach(particle => {
                particle.draw()
            })
        }
    }
}

tree = new QuadTree(20,new Rectangle(0,0,w,h))

//for(let i = 0; i < 5000; i++){
//    tree.addObject(new Particle(new Vector((Math.random()-0.5)*w/2+w/2,(Math.random()-0.5)*h/2+h/2), new Vector(0,0), 5))
//}

var dense = 50

window.addEventListener('mousedown', event => {
    p = winToCan(event.clientX, event.clientY)
    pos = new Vector(p.x,p.y)

    if(event.ctrlKey){
        tree.addObject(new Particle(pos,new Vector((Math.random()-0.5)*5,(Math.random()-0.5)*5),dense))
    }else{

    }
})

window.addEventListener('keydown', event => {
    key = event.key
    if(key == 'w'){dense += 10}
    if(key == 's'){dense -= 10}
})

tick()

function tick(){
    let time0 = Date.now()

    c.fillStyle = 'grey'
    c.fillRect(0,0,w,h)

    tree.draw()
    tree.tick(tree)

    //c.strokeStyle = 'blue'
    //c.strokeRect(0,0,200,200)


    //render the next frame after passing the correct amount of time
    let time1 = Date.now()
    let time_diff = time1-time0
    sleep_time = 1000/fps - time_diff
    sleep(sleep_time)

    let time2 = Date.now()

    c.fillText((1000/(time2-time0)).toString(),10,10)
    c.fillText((tree.numObjects()).toString(), 10, 20)
    c.fillText((dense).toString(),10,30)

    //console.log(, tree.numObjects())

    requestAnimationFrame(tick) //loop again
}