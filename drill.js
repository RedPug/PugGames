const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = Math.min(window.innerWidth,window.innerHeight)*0.8
canvas.height = Math.min(window.innerWidth,window.innerHeight)*0.8

function sleep(millis)
{
    //return new Promise(resolve => setTimeout(resolve, ms));
    
    var date = new Date();
    var curDate = null;
    do { curDate = new Date(); }
    while(curDate-date < millis);
}

const fps = 30

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
    constructor(p1, p2){
        this.p1 = p1
        this.p2 = p2
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
}

class Polygon{
    constructor(points){
        this.points = points
    }

    intersects(poly2){
        let xMin1 = this.points[0].x
        let xMax1 = this.points[0].x
        let yMin1 = this.points[0].y
        let yMax1 = this.points[0].y

        this.points.forEach(point => {
            xMin1 = Math.min(point.x,xMin1)
            xMax1 = Math.max(point.x,xMin1)
            yMin1 = Math.min(point.y,xMin1)
            yMax1 = Math.max(point.y,xMin1)
        })


        let xMin2 = poly2.points[0].x
        let xMax2 = poly2.points[0].x
        let yMin2 = poly2.points[0].y
        let yMax2 = poly2.points[0].y

        poly2.points.forEach(point => {
            xMin2 = Math.min(point.x,xMin2)
            xMax2 = Math.max(point.x,xMin2)
            yMin2 = Math.min(point.y,xMin2)
            yMax2 = Math.max(point.y,xMin2)
        })

        if(xMin1 > xMax2 || xMax1 < xMin2 || yMin1 > yMax2 || yMax1 < yMin2){return False} //if the bounding boxes aren't intersecting

        this.points.forEach((p1, i) => {
            let p2 = this.points[0]
            if(i < this.points.length-1){p2 = this.points[i+1]}

            let l1 = Line(p1,p2)

            poly2.points.forEach((p3, j) => {
                let p4 = poly2.points[0]
                if(j < poly2.points.length-1){p2 = poly2.points[j+1]}
    
                let l2 = Line(p3,p4)
                
                if(l1.intersects(l2)){
                    return true
                }
            })
        })
        return false
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
        let seg = 7
        for(let rad = 0; rad <= Math.PI*2; rad += Math.PI*2/seg){
            points.push({x:this.r*Math.cos(rad)+this.x, y:this.r*Math.sin(rad)+this.y})
        }

        return new Polygon(points)
    }

    draw(){
        c.beginPath()
        c.moveTo(this.bounds.points[0].x,this.bounds.points[0].y)
        this.bounds.points.forEach((p1, i) => {
            let p2 = this.bounds.points[0]
            if(i < this.bounds.points.length-1){p2 = this.bounds.points[i+1]}

            

            
            c.lineTo(p2.x,p2.y)
        })
        c.strokeStyle = 'rgb(135,84,56)'
        c.lineWidth = 4
        c.fillStyle = 'rgb(185,122,87)'
        c.fill()
        c.stroke()
    }
}



var rocks = [new Rock(100,100,30,0),new Rock(200,100,30,0)]

function onTick(){
    c.fillStyle = 'white'
    c.fillRect(0,0,c.width,c.height)

    rocks.forEach((rock) => {
        rock.draw()
    })
}


animate()