const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

//canvas.width = Math.min(window.innerWidth,window.innerHeight)*0.8
canvas.height = Math.min(window.innerWidth,window.innerHeight)*0.8
canvas.width = canvas.height * 16/9

function sleep(millis)
{
    //return new Promise(resolve => setTimeout(resolve, ms));
    
    var date = new Date();
    var curDate = null;
    do { curDate = new Date(); }
    while(curDate-date < millis);
}

/**
 * converts window coordinates to canvas coordinates
 * @param {number} x 
 * @param {number} y 
 * @returns canvas coordinates
 */

function winToCan(x,y){
    let box = canvas.getBoundingClientRect()
    return {
        x: x - box.left * (canvas.width / box.width),
        y: y - box.top * (canvas.height / box.height)
    }
}

const fps = 30
const tps = 30

function animate(){
    let time0 = Date.now()

    onTick()

    let time1 = Date.now()
    let time_diff = time1-time0
    sleep_time = 1000/fps - time_diff
    sleep(sleep_time)

    requestAnimationFrame(animate) //loop again
}


class Line{
    /**
     * 
     * @param {object} p1 
     * @param {object} p2 
     */
    constructor(p1, p2){
        this.p1 = p1
        this.p2 = p2
    }

    static fromCoords(x1, y1, x2, y2){
        return new Line({x:x1, y:y1}, {x:x2, y:y2})
    }

    #cross(v1,v2){
        return v1.x * v2.y - v1.y * v2.x
    }

    intersects(l2){
        let l1 = this

        let v1 = {x:l1.p2.x-l1.p1.x, y:l1.p2.y-l1.p1.y} //vector form of line 1
        let v2 = {x:l1.p2.x-l2.p1.x, y:l1.p2.y-l2.p1.y} //vector from point 1 of line 2 to point 2 of line 1
        let v3 = {x:l1.p2.x-l2.p2.x, y:l1.p2.y-l2.p2.y} //vector from point 2 of line 2 to point 2 of line 1

        let v4 = {x:l2.p2.x-l2.p1.x, y:l2.p2.y-l2.p1.y} //vector form of line 2
        let v5 = {x:l2.p2.x-l1.p1.x, y:l2.p2.y-l1.p1.y} //vector from point 1 of line 1 to point 2 of line 2
        let v6 = {x:l2.p2.x-l1.p2.x, y:l2.p2.y-l1.p2.y} //vector from point 2 of line 1 to point 2 of line 2

        let s1 = Math.sign(this.#cross(v1,v2))
        let s2 = Math.sign(this.#cross(v1,v3))
        let s3 = Math.sign(this.#cross(v4,v5))
        let s4 = Math.sign(this.#cross(v4,v6))

        if(s1 == s2 || s3 == s4){return false}

        return true
    }

    intersection(l2){
        if(!this.intersects(l2)){return undefined}
        let p0 = this.p1
        let p1 = this.p2
        let p2 = l2.p1
        let p3 = l2.p2

        let s1x = p1.x - p0.x; let s1y = p1.y - p0.y
        let s2x = p3.x - p2.x; let s2y = p3.y - p2.y

        let s = (-s1y * (p0.x - p2.x) + s1x * (p0.y - p2.y)) / (-s2x * s1y + s1x * s2y)
        let t = (s2x * (p0.y - p2.y) - s2y * (p0.x - p2.x)) / (-s2x * s1y + s1x * s2y)

        if(s >= 0 && s <= 1 && t >=0 && t<= 1){
            return {x: p0.x + (t * s1x), y: p0.y + (t * s1y)}
        }
    }
}

class Polygon{
    constructor(x,y,points){
        this.x = x
        this.y = y
        this.points = points
    }

    /**
     * ONLY WORKS WITH CONVEX POLYGONS & INEFFICIENT; DO NOT USE
     * @param {Polygon} poly 
     * @returns whether or not `poly` and this intersect/overlap
     */
    intersectsCV(poly){
        let xMin1 = this.points[0].x + this.x
        let xMax1 = this.points[0].x + this.x
        let yMin1 = this.points[0].y + this.y
        let yMax1 = this.points[0].y + this.y

        this.points.forEach(point => {
            xMin1 = Math.min(point.x + this.x, xMin1)
            xMax1 = Math.max(point.x + this.x, xMax1)
            yMin1 = Math.min(point.y + this.y, yMin1)
            yMax1 = Math.max(point.y + this.y, yMax1)
        })


        let xMin2 = poly.points[0].x + poly.x
        let xMax2 = poly.points[0].x + poly.x
        let yMin2 = poly.points[0].y + poly.y
        let yMax2 = poly.points[0].y + poly.y

        poly.points.forEach(point => {
            xMin2 = Math.min(point.x + poly.x, xMin2)
            xMax2 = Math.max(point.x + poly.x, xMax2)
            yMin2 = Math.min(point.y + poly.y, yMin2)
            yMax2 = Math.max(point.y + poly.y, yMax2)
        })

        if(xMin1 > xMax2 || xMax1 < xMin2 || yMin1 > yMax2 || yMax1 < yMin2){
            return false
        } //if the bounding boxes aren't intersecting

        //let contact = false

        for(let n = 0; n < 2; n++){
            let poly1 = this, poly2 = poly
            if(n == 1){poly1 = poly, poly2 = this}

            for(let i = 0; i < poly1.points.length; i++){
                let j = (i+1)%poly1.points.length
    
                let p1 = {x: poly1.points[i].x + poly1.x, y: poly1.points[i].y + poly1.y}
                let p2 = {x: poly1.points[j].x + poly1.x, y: poly1.points[j].y + poly1.y}
    
                let axis0 = {x: p2.x-p1.x, y: p2.y-p1.y}
                let axis = {x: -axis0.y, y: axis0.x} //perpendicular axis to the line from p1 to p2
    
                let min1 = Infinity
                let max1 = -Infinity
                for(let p = 0; p < poly1.points.length; p++){
                    let pt = poly1.points[p]
                    let v = axis.x * (pt.x + poly1.x) + axis.y * (pt.y + poly1.y)
                    min1 = Math.min(min1,v)
                    max1 = Math.max(max1,v)
                }
    
                let min2 = Infinity
                let max2 = -Infinity
                for(let p = 0; p < poly2.points.length; p++){
                    let pt = poly2.points[p]
                    let v = axis.x * (pt.x + poly2.x) + axis.y * (pt.y + poly2.y)
                    min2 = Math.min(min2,v)
                    max2 = Math.max(max2,v)
                }
    
                if(!(min1 <= max2 && min2 <= max1)){
                    return false
                }
            }
        }
        
        return true

        /*
        this.points.every((p, i) => {
            let p1 = {x: p.x + this.x, y: p.y + this.y}

            let p2 = {x: this.points[0].x + this.x, y: this.points[0].y + this.y}
            if(i < this.points.length-1){p2 = {x:this.points[i+1].x + this.x, y:this.points[i+1].y + this.y}}

            let l1 = new Line(p1,p2)

            poly2.points.every((p0, j) => {
                let p3 = {x: p0.x + poly2.x, y: p0.y + poly2.y}
                let p4 = {x: poly2.points[0].x + poly2.x, y: poly2.points[0].y + poly2.y}
                if(j < poly2.points.length-1){p4 = {x: poly2.points[j+1].x + poly2.x, y: poly2.points[j+1].y + poly2.y}}
    
                let l2 = new Line(p3,p4)
                
                if(l1.intersects(l2)){
                    //console.log('int')
                    contact = true
                    return false
                }
                return true
            })
            return !contact
        })
        */

        //return contact
    }

    #boundsIntersect(poly){
        let xMin1 = this.points[0].x + this.x
        let xMax1 = this.points[0].x + this.x
        let yMin1 = this.points[0].y + this.y
        let yMax1 = this.points[0].y + this.y

        this.points.forEach(point => {
            xMin1 = Math.min(point.x + this.x, xMin1)
            xMax1 = Math.max(point.x + this.x, xMax1)
            yMin1 = Math.min(point.y + this.y, yMin1)
            yMax1 = Math.max(point.y + this.y, yMax1)
        })


        let xMin2 = poly.points[0].x + poly.x
        let xMax2 = poly.points[0].x + poly.x
        let yMin2 = poly.points[0].y + poly.y
        let yMax2 = poly.points[0].y + poly.y

        poly.points.forEach(point => {
            xMin2 = Math.min(point.x + poly.x, xMin2)
            xMax2 = Math.max(point.x + poly.x, xMax2)
            yMin2 = Math.min(point.y + poly.y, yMin2)
            yMax2 = Math.max(point.y + poly.y, yMax2)
        })

        if(xMin1 > xMax2 || xMax1 < xMin2 || yMin1 > yMax2 || yMax1 < yMin2){
            return false
        }
        return true
    }

    /**
     * 
     * @param {Polygon} poly 
     * @returns whether or not `poly` and this intersect/overlap
     */
    intersects(poly){

        if(!this.#boundsIntersect(poly)){
            return false
        }//if the bounding boxes aren't intersecting

        for(let n = 0; n < 2; n ++){
            let poly1 = this; let poly2 = poly
            if(n == 1){poly1 = poly; poly2 = this}

            for(let i = 0; i < poly1.points.length; i ++){
                let p1 = poly1.points[i]
                let p2 = {x:p1.x+poly1.x, y: p1.y+poly1.y}
                if(poly2.containsPoint(p2)){
                    return true
                }
            }
        }
        return false
    }

    /**
     * 
     * @param {object} point 
     * @returns Whether or not this polygon contains `point`
     */
    containsPoint(point){

        let count = 0

        let l0 = Line.fromCoords(point.x, point.y, point.x+10000, point.y)

        /*
        c.beginPath()
        c.moveTo(point.x,point.y)
        c.lineTo(point.x+10000,point.y)
        c.strokeStyle = 'red'
        c.stroke()
        */

        for(let i = 0; i < this.points.length; i++){
            let j = (i+1)%this.points.length

            let p1 = this.points[i]
            p1 = {x:p1.x+this.x, y:p1.y+this.y}
            let p2 = this.points[j]
            p2 = {x:p2.x+this.x, y:p2.y+this.y}

            let l1 = new Line(p1,p2)

            if(l1.intersects(l0)){
                count ++
            }
        }

        return count % 2 == 1
    }

    /**
     * 
     * @param {Polygon} poly 
     * @returns Returns whether or not `poly` is fully contained within this
     */
    within(poly){
        //same as intersection but uses AND instead of OR with the lines

        if(!this.#boundsIntersect(poly)){
            return false
        }//if the bounding boxes aren't intersecting

        let within = true

        let poly1 = this; let poly2 = poly

        for(let i = 0; i < poly1.points.length; i ++){
            let p1 = poly1.points[i]
            let p2 = {x:p1.x+poly1.x, y: p1.y+poly1.y}
            if(!poly2.containsPoint(p2)){
                within = false
            }
        }
        return within
    }

    static nGon(x,y,sides, radius){
        let inc = Math.PI * 2 / sides

        let points = []

        for(let i = 0; i < Math.PI*2; i += inc){
            points.push({x: radius*Math.cos(i),y: radius*Math.sin(i)})
        }

        return new Polygon(x,y,points)
    }

    draw(){
        c.moveTo(this.points[0].x + this.x, this.points[0].y + this.y)
        
        for(let i = 1; i < this.points.length; i++){
            let p = this.points[i]
            c.lineTo(p.x + this.x, p.y + this.y)
        }

        c.closePath()
    }
}

class Rock{
    constructor(x,y,r,chaos){
        this.x = x
        this.y = y
        this.r = r
        this.chaos = chaos
        this.bounds = this.genShape()
    }

    genShape(){
        let points = []
        let seg = 5
        let offset = Math.random()*Math.PI*2

        for(let rad = 0; rad <= Math.PI*2; rad += Math.PI*2/seg){
            points.push({x:this.r*Math.cos(rad+offset), y:this.r*Math.sin(rad+offset)})
        }

        return new Polygon(this.x, this.y, points)
    }

    tick(){
        this.bounds.x = this.x
        this.bounds.y = this.y
    }

    draw(){
        c.beginPath()
        c.moveTo(this.bounds.points[0].x+this.x,this.bounds.points[0].y+this.y)
        this.bounds.points.forEach((p1, i) => {
            let p2 = this.bounds.points[0]
            if(i < this.bounds.points.length-1){p2 = this.bounds.points[i+1]}
            c.lineTo(p2.x+this.x,p2.y+this.y)
        })
        c.strokeStyle = 'rgb(90,50,30)'
        c.lineWidth = 4
        c.fillStyle = `rgb(80,80,95)`
        c.fill()
        c.stroke()
    }
}

const DIRT = 'rgb(130,80,50)'
const SLUDGE = 'rgb(130,150,160)'

var rocks = [new Rock(100,100,30,0)]

var path = [{x:215, y:screen.height*0.2, dir:0}]
var dir = 1

var fill_level = 0
var fill_cap = 3000

var num_pipes = 30
var pipe_length = 0
var p_len = 150

var dead_path = []

var ground_mesh = genSurface(10, canvas.width, canvas.height-170, 80)

var moving = false
var reverse = false

var direction = 0

var speed = 5
var end_offset = 1


function genSurface(res, width0, height, amp){
    let surface = [{x: canvas.width, y: canvas.height},{x:0,y:canvas.height},{x:0,y:canvas.height-height+50},{x:200,y:canvas.height-height+50},{x:200,y: 160}]

    let width = width0 - 200

    for(let i = 1/res; i < 1; i += 1/res){
        surface.push({x: i*width + 200, y: canvas.height-height - (Math.random()-0.5)*2*amp})
    }

    return new Polygon(0,0,surface)
    //return Polygon.nGon(0,0,8,500)
}

function drawTube(x,y,w,h,end_width){
    c.strokeStyle = 'rgb(60,60,60)'
    c.lineWidth = 1

    c.fillStyle = 'rgb(100,100,100)'
    c.beginPath()
    c.rect(x,y,w,h)
    c.fill()
    c.stroke()

    c.beginPath()
    c.ellipse(x+1,y+h/2,end_width,h/2,0,Math.PI/2,3*Math.PI/2)
    c.fill()
    c.stroke()

    c.beginPath()
    c.fillStyle = 'rgb(80,80,80)'
    c.ellipse(x+w,y+h/2,end_width,h/2,0,0,6.3)
    c.fill()
    c.stroke()
}

function drawTubes(x,y,w,h){

    c.fillStyle = 'rgb(60,60,60)'
    c.fillRect(x,y,w,canvas.height)

    let pipenum = num_pipes - (pipe_length+0.0001) / p_len

    let num_rows = Math.floor(pipenum/5)
    for(let i = 0; i < pipenum-1; i++){
        r = Math.floor(i/5)
        drawTube(10 + 6*(num_rows-r),y-15*(i%5+1),p_len,15, 6/2)
    }
}

function drawDrill(){
    let spot = path[path.length-Math.floor(end_offset)]

    c.lineCap = 'round'
    
    if(dead_path.length > 0){
        c.fillStyle = 'rgb(100,60,50)'
        //c.lineWidth = 12
        //c.beginPath()
        //c.moveTo(dead_path[0].x, dead_path[0].y)
        dead_path.forEach(pos => {
            //c.lineTo(pos.x,pos.y)
            c.beginPath()
            c.arc(pos.x,pos.y,7.5,0,6.3)
            c.fill()
        })
        //c.fill()
    }
    
    if(path.length > 0){
        c.lineCap = 'butt'

        
        c.beginPath()
        c.moveTo(path[0].x,path[0].y)
        path.forEach(pos => {
            c.lineTo(pos.x,pos.y)
        })
        c.strokeStyle = 'rgb(100,60,50)'
        c.lineWidth = 15
        c.stroke()

        c.strokeStyle = 'rgb(40,40,40)'
        c.lineWidth = 11
        c.stroke()

        c.strokeStyle = 'rgb(90,90,90)'
        c.lineWidth = 7
        c.stroke()



    }

    c.fillStyle = 'grey'
    c.beginPath()
    c.arc(spot.x, spot.y, 10, 0, 6.3)
    c.fill()
    c.beginPath()
    c.ellipse(spot.x,spot.y,20,10,spot.dir+dir/2,Math.PI/2,3*Math.PI/2, true)
    c.fill()
}

function drawGround(mesh){
    c.fillStyle = DIRT

    c.beginPath()
    mesh.draw()
    c.fill()
}

function draw(){
    c.fillStyle = 'rgb(50,180,230)'
    c.fillRect(0,0,canvas.width,canvas.height)

    drawTubes(0,canvas.height*0.2,200,75*2)

    drawGround(ground_mesh)

    drawDrill()

    rocks.forEach((rock) => {
        rock.draw()
    })
}

function onTick(){

    draw()
    end_offset = Math.max(end_offset,1)

    rocks.forEach((rock) => {
        rock.tick()
        rocks.forEach((rock2) => {
            if(rock2 != rock){
                if(rock.bounds.intersects(rock2.bounds)){
                    //console.log('contact')
                }
            }
        })
    })

    if(reverse){
        //end_offset += 1
        if(path.length > 1){
            dead_path.push(path.pop())
            pipe_length -= speed
        }
    }

    let spot = path[path.length-Math.floor(end_offset)]

    if(moving && pipe_length < p_len * num_pipes){
        direction = spot.dir + dir * 0.01*speed
        let new_spot = {x: spot.x + speed*Math.cos(direction), y: spot.y + speed*Math.sin(direction), dir: direction}
        let filt = path.filter(e => {return (e.x - new_spot.x)**2 + (e.y - new_spot.y)**2 < 17**2})

        let in_ground = Polygon.nGon(spot.x, spot.y, 8, 10).within(ground_mesh)

        if(in_ground){
            if(filt.length < 5){
                path.push(new_spot)
                fill_level += 1
                pipe_length += speed
            }
        }

    }


}

addEventListener('mousemove', event =>{
    let x0 = event.clientX
    let y0 = event.clientY

    let pos = winToCan(x0,y0)
    let x = pos.x
    let y = pos.y

    if(x > canvas.width || x < 0 || y > canvas.height || y < 0){return}

    rocks[0].x = x
    rocks[0].y = y
})

addEventListener('keydown', event =>{
    key = event.key

    if(key == ' '){dir *= -1}

    if(key == 'w'){moving = true}

    if(key == 's'){reverse = true}

    if(key == 'Enter'){}
})

addEventListener('keyup', event =>{
    key = event.key

    if(key == 'w'){moving = false}

    if(key == 's'){reverse = false}
})

animate()