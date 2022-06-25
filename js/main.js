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
        yellow: "white",
        orange: "white",
        purple: "white"
    },
    fontSize: {
        1: "1rem",
        2: "1.1rem",
        3: "1.2rem",
        4: "1.3rem"
    }
}



class Game {
    constructor(board, players){
        this.board = board
        this.players = players // array with selected players
        this.playersRemaining = this.players // array with players still on the board
        this.playerOn = null
        this.hasOverflown = false
        this.gameOn = false
        this.board.fields.forEach(field => field.game = this)
    }

    startGame(){
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

    checkRemainingPlayers(){
        if(this.hasOverflown){
            const playersOfFields = this.board.fields.map(field => field.player)
            const playersLeft = this.playersRemaining.filter(player => playersOfFields.includes(player))
            if(playersLeft.length !== this.playersRemaining.length){
                this.playersRemaining = playersLeft
                if(this.playersRemaining.length === 1){
                    this.endGame()
                }
            }
        }
        if(this.gameOn){
            this.getNextPlayer() 
        }
    }

    getNextPlayer(){
        const currentIndex = this.playersRemaining.indexOf(this.playerOn)
        const nextIndex = (currentIndex + 1) % this.playersRemaining.length
        this.playerOn = this.playersRemaining[nextIndex]
        this.setIsOn()
    }
    
    endGame(){
        console.log(this.playersRemaining[0] + " has won!")
        this.playerOn = null
        this.gameOn = false
    }
    
    computerMoves(){
        // TO DO
    }
}



class Player {
    constructor(color){
        this.color = color
        this.isOn = false
        this.isComputer = false
        console.log("A new player has been created.")
    }
}



class Board {
    constructor(players, size = 10, numThickBorders = 0){
        this.boardEl = document.getElementById("board")
        this.size = size
        this.fields = []

        let k = 0
        for (let i = 1; i <= size; i++){
            for (let j = 1; j <= size; j++){
                const col = i
                const row = j
                const id = k
                k++

                const field = new Field(id, row, col, this)
                const fieldEl = document.createElement("div")
                fieldEl.className = `field row${row} col${col}`
                fieldEl.id = "field" + id
                fieldEl.style.gridArea = `${row} / ${col} / span 1 / span 1`
                this.boardEl.appendChild(fieldEl)
                
                fieldEl.addEventListener("click", () => {
                    console.log("click on " + this.id)
                    field.selectField()
                })
                
                field.fieldEl = fieldEl
                this.fields.push(field)
            }
        }
        this.fields.forEach(field => field.getNeighbors())
        console.log(this)
    }
}



class Field {
    constructor(id, row, col, board){
        this.id = id
        this.row = row
        this.col = col
        this.player = null
        this.value = 0
        this.neighbors = []
        this.game = null
        this.board = board
        this.fieldEl = null
    }
    
    getNeighbors(){
        const row = this.row
        const col = this.col
        const size = this.board.size
        const fields = this.board.fields
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
        this.value = value
        this.fieldEl.textContent = this.value
        this.fieldEl.style.backgroundColor = styles.backgroundColor[this.player.color]
        this.fieldEl.style.color = styles.color[this.player.color]
        this.fieldEl.style.color = styles.fontSize[this.value.toFixed()]
    }

    selectField(){
        console.log(this.player.isOn)
        if(this.player.isOn){
            console.log(`${this.player} clicked on ${this.id}`)
            this.player.isOn = false
            this.increaseValue()
            // Note: The next line is only executed when all fields are done with overflowing.
            // But this will need to be embedded in a promise if setTimeout() is used.
            this.game.checkRemainingPlayers()
        }
    }
    
    increaseValue(){
        this.value++
        console.log(this.value)
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
        console.log(this.neighbors)
        this.neighbors.forEach(neighbor => {
            if(neighbor.player === null || neighbor.player.color !== this.player.color){
                neighbor.setPlayer(this.player)
            }
            neighbor.increaseValue()
        })
    }

    setPlayer(player){
        this.player = player
        this.fieldEl.style.backgroundColor = styles.backgroundColor[this.player.color]
        this.fieldEl.style.color = styles.color[this.player.color]
    }
}




// instantiating classes and starting a new game
const red = new Player("red")
const blue = new Player("blue")

const players = [red, blue]

const board = new Board(players)

board.fields[0].setField(red, 1)
board.fields[44].setField(blue, 2)

const game = new Game(board, players)

game.startGame()
console.log(game.playerOn.color)


// helper functions
function selectRandomElement(arr){
    const index = Math.floor(arr.length * Math.random())
    const randomEl = arr[index]
    return randomEl
}

function getField(fields, row, col){
    return fields.find(field => field.row === row && field.col === col)
}