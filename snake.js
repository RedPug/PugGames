const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = Math.min(window.innerWidth,window.innerHeight)*0.8
canvas.height = Math.min(window.innerWidth,window.innerHeight)*0.8


//c.fillStyle = 'blue'
//c.fillRect(0,0,10,20)

function sleep(millis)
{
    //return new Promise(resolve => setTimeout(resolve, ms));
    
    var date = new Date();
    var curDate = null;
    do { curDate = new Date(); }
    while(curDate-date < millis);
}

function arrayEqual(a,b){
    return JSON.stringify(a) == JSON.stringify(b)
}

let keyCount = 0
var dir = [1,0]

window.addEventListener('keydown', (event) => {
    key = event.key

    if(keyCount < 1){
        if(key == 'w' && !arrayEqual(dir,[0,1])){
            dir = [0,-1]
            keyCount ++
        }
    
        if(key == 's' && !arrayEqual(dir,[0,-1])){
            dir = [0,1]
            keyCount ++
        }
    
        if(key == 'd' && !arrayEqual(dir,[-1,0])){
            dir = [1,0]
            keyCount ++
        }
    
        if(key == 'a' && !arrayEqual(dir,[1,0])){
            dir = [-1,0]
            keyCount ++
        }
    }
})

class Slot{
    constructor(x,y){
        this.x = x
        this.y = y
        this.type = 'empty'
    }

    draw(){
        var sw = slot_width
        var sh = slot_height

        //c.beginPath()
        //c.lineWidth = 1
        //c.strokeStyle = 'grey'
        //c.rect(this.x*sw,this.y*sh,sw,sh)
        //c.stroke()

        c.fillStyle = 'black'
        c.fillRect(this.x*sw, this.y*sh, sw+1, sh+1)

        if (this.type == 'snake'){
            c.fillStyle = 'green'
            if (true){ //normal segment
                c.fillRect(this.x*sw, this.y*sh, sw, sh)
            }else{ //head
                c.fillRect(this.x*sw+1+1, this.y*sh+1, sw-2 -1, sh -1)
                c.fillRect(this.x*sw+1, this.y*sh+1+1, sw -1, sh-2 -1)
            }
        }

        if (this.type == 'apple'){
            c.fillStyle = 'red'
            c.fillRect(this.x*sw + sw/6, this.y*sh + sh/6, sw-sw/3, sh-sw/3)
            //canvas.drawPixel(this.x*sw + sw/2, this.y*sh + 2)
        }

        c.strokeStyle = 'grey'
        c.strokeRect(this.x*sw, this.y*sh, sw, sh)
        
    }
}

function pick(arr){
    if(arr instanceof Array){
        let len = arr.length
        let index = Math.floor(Math.random()*len)
        return arr[index]
    }
    return arr
}

function genApples(grid, num_apples){
    for(let n = 0; n < num_apples; n++){
        let slot = pick(pick(grid))
        let count = 1
        while(slot.type == 'snake' || slot.type == 'apple'){
            if(count >= grid.length * grid[0].length){
                return
            }
            count ++
            slot = pick(pick(grid))
        }
        slot.type = 'apple'
        return
    }
}

function eat(){
    genApples(grid,1)
    max_snake++
}

function die(){
    init()
}

var grid_width = 16
var grid_height = 16

var slot_width = canvas.width/grid_width
var slot_height = canvas.height/grid_height

var grid = []

var snake = []

var fps = 6



var max_snake

function animate(){
    let time0 = Date.now()

    keyCount = 0

    if(snake.length > max_snake){ 
        snake.shift() //remove tail
    }
    
    //do stuff
    y = snake[snake.length-1].y + dir[1]
    x = snake[snake.length-1].x + dir[0]
    if(!(y >= 0 && y < grid.length && x >= 0 && x < grid[0].length)){die(); return}
    newSlot = grid[y][x]

    if (newSlot.type == 'snake'){die(); return}
    if (newSlot.type == 'apple'){eat()}
    snake.push(newSlot) //add new head
    //console.log(snake.length)

    if(snake.length > max_snake){ 
        snake.shift() //remove tail
    }


    //draw all of the segments
    grid.forEach((element) => {
        element.forEach((slot) => {
            if(slot.type != 'apple'){slot.type = 'none'}
            if(snake.includes(slot)){slot.type = 'snake'}
            slot.draw()
        })
    })

    //render the next frame after passing the correct amount of time
    let time1 = Date.now()
    let time_diff = time1-time0
    sleep_time = 1000/fps - time_diff
    sleep(sleep_time)

    requestAnimationFrame(animate) //loop again
}

function init(){
    //generate the grid
    for(let i = 0; i < grid_height; i++){
        grid[i] = new Array(grid_width)
        for(let j = 0; j < grid_width; j++){
            grid[i][j] = new Slot(j,i)
        }
    }

    snake = [grid[Math.floor(grid_height/2)][Math.floor(grid_width/2)]]//set the snake to the middle

    genApples(grid,1) //make the first apple

    max_snake = 3

    dir = [1,0]

    //start looping
    animate()
}

init()





