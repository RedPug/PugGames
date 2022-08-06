const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = Math.min(window.innerWidth,window.innerHeight)*0.55
canvas.height = Math.min(window.innerWidth,window.innerHeight)*0.8

const w = canvas.width
const h = canvas.height

const hex = (r, g, b) => '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')

c.fillStyle = hex(64,64,64)
c.fillRect(w/8,w/6,w*0.75,w/3)

c.fillStyle = hex(255,255,255)
c.font = "60px Arial"
c.textAlign = 'center'
c.fillText('0.0.0.0.0.0.0.0',w/2,w/6+90)

function calculate(str){
    let data = str.match(/[a-zA-Z]+|[0-9]+|[()]+|[+]|[\-]|[*]|[/]|[%]|[^]+/g) //separate the input into numbers, words, and operators
    data.push(')')
    data.unshift('(')

    let v = data
    let count = 0
    console.log('data:',v)
    while(v.length > 1 && count < 100){
        console.log('data:',v)
        let groupDat = getGroup(v)
        let group = groupDat[0]
        let index0 = groupDat[1]
        let index1 = groupDat[2]

        let x = evaluateOperations(group)

        v.splice(index0, (index1)-(index0)+1, x.toString())

        evaluateFunctions(v)

        //if(group.length == 1){
        //    break
        //}
        //v = v.slice(0, index0+1) + x.toString() + v.slice(index1, v.length+1)

        count++
    }

    //evaluateFunctions(v)
    //console.log('data:',v)
    return v
    return parseFloat(v[0])
}

/**
 * returns the array with the area from start to end removed and replaced with value
 */
function cut(arr,start,end,value){
    let out = []
    arr.forEach(element => {

    })
}

function getGroup(data){
    //get the farthest group inside the list, ensuring no groups exist inside of it
    let open = []
    let closed = []
    for(let i = 0; i < data.length; i++){
        let v = data[i]
        if(v == '('){open.push(i)}
        if(v == ')'){closed.push(i)}
    }

    if(open.length != closed.length){console.log('parenthesis not matched'); return}

    let val = []
    for(let j = open[open.length-1]+1; j < closed[0]; j++){
        val.push(data[j])
    }
    //console.log('group:',val)

    //if(val.length == 1){return null}

    return [val,open[open.length-1],closed[0]]
}

function checkIfExists(element,group){
    out = false
    element.forEach(item => {
        //console.log(group.indexOf(item[0]))
        if(group.indexOf(item[0]) != -1){
            out = true
        }
    })
    return out
}

function evaluateOperations(group){
    //operators
    let expressions = [
        [['^', (a,b) => {return Math.pow(a,b)}]],
        [['*', (a,b) => {return a*b}],['/', (a,b) => {return a/b}]],
        [['+', (a,b) => {return a+b}],['-', (a,b) => {return a-b}]]
    ]
    expressions.forEach((element) => { //runs through every expression group that is executed at the same time
        //console.log(checkIfExists(element,group),element[0][0])
        while(checkIfExists(element,group)){ //while the operators are in the group, find them
            let v = [group.length,-1] // first value is the index of the expression in the data stream, second is the index of the operator in the group to find a func
            element.forEach((operator, index) => { //checks for the first appearance of an operator in the group
                let i = group.indexOf(operator[0])
                if(i < v[0] && i != -1){
                    v = [i,index]
                }
            })
            //console.log('test')

            if(v[1] != -1){ //if an operator was found, do stuff with it
                let func = element[v[1]][1] //use the function from the list
                //console.log('test func:',func(2,3))

                //console.log(group[v[0]-1])

                let x = func(parseFloat(group[v[0]-1]),parseFloat(group[v[0]+1]))

                group.splice(v[0]-1, 3, x) //condense the expression into a value

                //console.log('value:',x)
            }
        }
    })

    return group[0]
}

function evaluateFunctions(data){
    console.log('test data:', data)
    //functions
    let functions = [
        ['sin', Math.sin],
        ['cos', Math.cos],
        ['tan', Math.tan]
    ]

    while(checkIfExists(functions,data)){ //while a function is in the data stream
        let i = [data.length,-1]
        functions.forEach((element,index) => {//check for which function comes first
            let ind = data.indexOf(element[0])
            if(ind < i[0] && ind != -1){
                i = [ind, index]
            }
        })

        let func = functions[i[1]][1]
        let x = func(parseFloat(data[i[0]+1]))
        
        console.log('v:',data[i[0]+1],' f:',func,' x:',x)

        data.splice(i[0],2,x)
    }
}