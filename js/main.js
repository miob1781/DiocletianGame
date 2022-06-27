const styles = {
    backgroundColor: {
        red: "red",
        green: "green",
        blue: "blue",
        yellow: "yellow",
        orange: "orange",
        purple: "purple"
    },    
    color: {
        red: "white",
        green: "white",
        blue: "white",
        yellow: "black",
        orange: "black",
        purple: "white"
    },    
    fontSize: {
        1: "1rem",
        2: "1.15rem",
        3: "1.3rem",
        4: "1.45rem"
    }    
}    

class Field {
    constructor(id, row, col){
        this.fieldEl = null
        this.id = id
        this.row = row
        this.col = col
        this.player = null
        this.value = 0
        this.neighbors = []
        this.game = null
    }    
    
    getNeighbors(){
        const row = this.row
        const col = this.col
        const size = this.game.size
        const fields = this.game.fields
        let neighbor
        
        if(col > 1){
            neighbor = getField(fields, row, col-1)
            this.neighbors.push(neighbor)
        }    
        if(col < size){
            neighbor = getField(fields, row, col+1)
            this.neighbors.push(neighbor)           
        }    
        if(row > 1){
            neighbor = getField(fields, row-1, col)
            this.neighbors.push(neighbor)
        }    
        if(row < size){
            neighbor = getField(fields, row+1, col)
            this.neighbors.push(neighbor)
        }    
    }    
    
    setField(player, value){
        this.player = player
        this.player.fields.push(this)
        this.value = value
        this.fieldEl.textContent = this.value
        this.fieldEl.style.backgroundColor = styles.backgroundColor[this.player.color]
        this.fieldEl.style.color = styles.color[this.player.color]
        this.fieldEl.style.fontSize = styles.fontSize[this.value.toFixed()]
    }    
    
    selectField(){
        if(this.player.isOn){
            this.player.isOn = false
            this.increaseValue()
            this.game.getNextPlayer()
        }    
    }    
    
    increaseValue(){
        if(!this.game.gameOn){
            return
        }
        this.value++
        this.fieldEl.textContent = this.value
        this.fieldEl.style.fontSize = styles.fontSize[this.value.toFixed()]
        if(this.value > this.neighbors.length){
            this.overflow()
        }    
    }    
    
    overflow(){
        this.value = 1
        this.fieldEl.textContent = 1
        this.fieldEl.style.fontSize = styles.fontSize["1"]
        this.neighbors.forEach(neighbor => {
            if(!neighbor.player || neighbor.player.color !== this.player.color){
                let oldOwner
                if(neighbor.player){
                    oldOwner = neighbor.player
                    neighbor.player.fields = neighbor.player.fields.filter(field => field.id !== neighbor.id)
                }    
                neighbor.player = this.player
                neighbor.player.fields.push(neighbor)
                neighbor.fieldEl.style.backgroundColor = styles.backgroundColor[this.player.color]
                neighbor.fieldEl.style.color = styles.color[this.player.color]
                if(oldOwner){
                    this.game.checkRemainingPlayers(oldOwner)
                }    
            }    
            neighbor.increaseValue()
        })    
    }    
}

class Player {
    constructor(color){
        this.color = color
        this.isOn = false
        this.isComputer = false
        this.fields = []
        console.log("A new player has been created.")
    }    

    appendField(field){
        this.fields.push(field)
    }    
}    

class Game {
    constructor(){
        this.boardEl = document.getElementById("board")
        this.fields = []
        this.size = null
        this.players = null
        this.density = null
        this.playersRemaining = null
        this.playerOn = null
        this.gameOn = false
        console.log("creating new game...")
    }    

    createBoard(options){
        this.size = options.size
        this.players = options.players
        this.density = options.density
        this.boardEl.style.gridTemplateColumns = `repeat(${this.size}, 5vw)`
        this.boardEl.style.gridTemplateRows = `repeat(${this.size}, 5vw)`
    
        let k = 0
        for (let i = 1; i <= this.size; i++){
            for (let j = 1; j <= this.size; j++){
                const col = i
                const row = j
                const id = k
                k++
                
                const field = new Field(id, row, col)
                const fieldEl = document.createElement("div")
                fieldEl.className = `field row${row} col${col}`
                fieldEl.id = "field" + id
                fieldEl.style.gridArea = `${row} / ${col} / span 1 / span 1`
                this.boardEl.appendChild(fieldEl)
                
                fieldEl.addEventListener("click", () => {
                    field.selectField()
                })
                
                field.fieldEl = fieldEl
                field.game = this
                this.fields.push(field)
            }
        }
        this.fields.forEach(field => field.getNeighbors())
        this.addPlayers()
        
        console.log(this)
    }

    addPlayers(){
        const size = this.size
        const players = this.players
        const density = this.density
        
        players.forEach(player => {
            if(size < 7 && density === "sparse"){
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 1)
                this.assignPlayerToField(player, 1)
            } else if((size < 7 && density === "medium")
                    || (size >= 7 && density === "sparse")){
                this.assignPlayerToField(player, 3)
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 1)
                this.assignPlayerToField(player, 1)
            } else if((size < 7 && density === "dense")
            || (size >= 7 && density === "medium")){
                this.assignPlayerToField(player, 3)
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 1)
                this.assignPlayerToField(player, 1)
            } else if(size >= 7 && density === "dense"){
                this.assignPlayerToField(player, 3)
                this.assignPlayerToField(player, 3)
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 1)
                this.assignPlayerToField(player, 1)
                this.assignPlayerToField(player, 1)
            }
        })
    }

    assignPlayerToField(player, value){
        let index, field
        do {
            index = Math.floor(this.fields.length * Math.random())
            field = this.fields[index]
        } while(field.player || field.neighbors.length - value < 1)
        field.setField(player, value)
    }  
    
    startGame(){
        this.playersRemaining = this.players
        this.playerOn = selectRandomElement(this.playersRemaining)
        this.gameOn = true
        this.setIsOn()
        console.log("A new game has started")
    }
    
    setIsOn(){
        this.playerOn.isOn = true
        console.log(`It's ${this.playerOn.color}'s turn.`)
        if(this.playerOn.isComputer){
            this.computerMoves()
        }    
    }    

    checkRemainingPlayers(player){
        if(player.fields.length === 0){
            this.playersRemaining = this.playersRemaining.filter(playerRemaining => playerRemaining.color !== player.color)
            if(this.playersRemaining.length === 1){
                this.endGame()
            }    
        }    
    }    

    getNextPlayer(){
        if(this.gameOn){
            const currentIndex = this.playersRemaining.indexOf(this.playerOn)
            const nextIndex = (currentIndex + 1) % this.playersRemaining.length
            this.playerOn = this.playersRemaining[nextIndex]
            this.setIsOn()
        }    
    }    
    
    endGame(){
        console.log(this.playersRemaining[0].color + " has won!")
        this.playerOn = null
        this.gameOn = false
    }    
    
    computerMoves(){
        const selectedField = selectRandomElement(this.playerOn.fields)
        selectedField.selectField()
    }    
}    

// instantiating classes and starting a new game
const options = {
    players: [
        new Player("red"),
        new Player("blue"),
        new Player("yellow"),
        new Player("green"),
        new Player("orange"),
        new Player("purple")
    ],
    size: 10,
    density: "dense" 
}

for (let player of options.players){
    if(player.color !== "red"){
        player.isComputer = true
    }
}

const game = new Game()
game.createBoard(options)
game.startGame()

// helper functions
function selectRandomElement(arr){
    const index = Math.floor(arr.length * Math.random())
    const randomEl = arr[index]
    return randomEl
}

function getField(fields, row, col){
    return fields.find(field => field.row === row && field.col === col)
}
