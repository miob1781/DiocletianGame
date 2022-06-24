class Game {
    constructor(board, players){
        this.board = board
        this.players = players // array with selected players
        this.playersRemaining = this.players // array with players still on the board
        this.playerOn = null
        this.board.fields.forEach(field => field.game = this)
        this.hasOverflown = false
        this.gameOn = false
    }

    startGame(){
        this.playerOn = selectRandomElement(this.playersRemaining)
        this.gameOn = true
        this.setIsOn()
        console.log("A new game has started")
    }
    
    setIsOn(){
        this.playerOn.isOn = true
        console.log(`It's ${this.playerOn}'s turn.`)
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
        const boardEl = document.getElementById("board")
        console.log("The board: " + boardEl)
        this.fields = []
        let k = 0
        let index, row, col
        for (let i = 0; i < size; i++){
            for (let j = 0; j < size; j++){
                col = i
                row = j
                index = k
                k++
                
                const field = new Field(index, row, col)
                this.fields.push(field)
                
                const fieldEl = document.createElement("div")
                fieldEl.className = "field"
                fieldEl.style.gridArea = `${row} / ${col} / span 1 / span 1`
                boardEl.appendChild(fieldEl)
            }
        }
        console.log("A new board has been created.")
    }
}



class Field {
    constructor(index, row, col){
        this.index = index
        this.row = row
        this.col = col
        this.player = null
        this.value = 0
        this.neighbors = []
        this.game = null
    }
    
    selectField(){
        if(this.player.isOn){
            this.player.isOn = false
            this.field.increaseValue()
            // Note: The next line is only executed when all fields are done with overflowing.
            this.game.checkRemainingPlayers()             
        }
    }
    
    increaseValue(){
        this.value++
        if(this.value > this.neighbors.length){
            this.overflow()
        }
    }
    
    overflow(){
        this.value = 1
        this.neighbors.forEach(neighbor => {
            neighbor.setPlayer(this.player)
            neighbor.increaseValue()
        })
    }

    setPlayer(player){
        this.player = player
    }
}




// instantiating classes and starting a new game
const red = new Player("red")
const blue = new Player("blue")

const players = [red, blue]

const board = new Board(players)

const game = new Game(board, players)

game.startGame()



// helper functions
function selectRandomElement(arr){
    const index = Math.floor(arr.length * Math.random())
    const randomEl = arr[index]
    return randomEl
}
