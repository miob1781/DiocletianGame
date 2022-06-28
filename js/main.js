const styles = {
    backgroundColor: {
        red: "red",
        green: "green",
        blue: "blue",
        yellow: "yellow",
        orange: "orange",
        purple: "purple",
        free: "lightgrey"
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
    }    

    appendField(field){
        this.fields.push(field)
    }    
}    

class Game {
    constructor(){
        this.boardEl = document.getElementById("board")
        this.size = null
        this.selectedPlayers = []
        this.density = null
        this.fields = []
        this.currentPlayers = []
        this.remainingPlayers = []
        this.playerOn = null
        this.gameOn = false
        this.error = false
    }    

    getInput(){
        const sizeEl = document.getElementById("size-input")
        this.selectSize(sizeEl)
        sizeEl.addEventListener("input", () => this.selectSize(sizeEl))

        const playerEls = document.querySelectorAll(".player input[type='checkbox']")
        playerEls.forEach(playerEl => {
            const player = new Player(playerEl.name)
            this.selectPlayer(playerEl, player)
            playerEl.addEventListener("input", () => this.selectPlayer(playerEl, player))
            const isComputerEls = playerEl.parentNode.querySelectorAll("input[type='radio']")
            isComputerEls.forEach(isComputerEl => {
                isComputerEl.addEventListener("input", () => this.selectIsComputer(playerEl, player))
            })
        })

        const checkedDensityEl = document.querySelector("#density input[name='density']:checked")
        this.selectDensity(checkedDensityEl)
        const densityEls = document.querySelectorAll("#density input[name='density']")
        densityEls.forEach(densityEl => {
            densityEl.addEventListener("input", () => this.selectDensity(densityEl))
        })

        const startButton = document.getElementById("start")
        startButton.addEventListener("click", () => {
            this.createBoard()
            this.startGame()
        })
    }

    selectSize(domEl){
        this.size = parseInt(domEl.value)
        const sizeDisplay = document.getElementById("size-display")
        sizeDisplay.textContent = this.size
    }

    selectPlayer(playerEl, player){
        if(playerEl.checked){
            this.selectIsComputer(playerEl, player)
            this.selectedPlayers.push(player)
        } else {
            this.selectedPlayers = this.selectedPlayers.filter(oldPlayer => oldPlayer.color !== playerEl.name)
        }
        console.log(this.selectedPlayers)
    }
    
    selectIsComputer(playerEl, player){
        const checkedIsComputerEl = playerEl.parentNode.querySelector("input[type='radio']:checked")
        player.isComputer = checkedIsComputerEl.value === "yes" ? true : false
    }

    selectDensity(domEl){
        this.density = domEl.value
    }
    
    displayError(message){
        const errorMessageEl = document.getElementById("error-message")
        errorMessageEl.textContent = message
        errorMessageEl.style.display = "block"
        this.error = true
    }

    createBoard(){
        /*
        combinations that must be disabled as the space on the board is limited:
            - size 5: 6 players medium; 5 players medium
            - size 4: 6 players sparse; 5 players medium; 4 players medium; 3 players medium
        
        */
        const errorMessageEl = document.getElementById("error-message")
        let message
        if(this.selectedPlayers.length <= 1){
            message = "You need to select at least two players."
            this.displayError(message)
            return
        } else if(this.size === 5 && this.selectedPlayers.length >= 5 && (this.density === "dense" || this.density === "medium")
        || (this.size === 4
            && (this.selectedPlayers.length >= 3 && (this.density === "dense" || this.density === "medium"))
            || this.selectedPlayers.length === 6 && this.density === "sparse")){
            message = "The selected values are not valid. Try selecting less players, a smaller field, or less density."
            this.displayError(message)
            return
        } else {
            errorMessageEl.style.display = "none"          
            this.error = false
        }
        
        this.fields = []
        this.selectedPlayers.forEach(player => player.fields = [])
        
        this.boardEl.remove()
        const boardContainer = document.getElementById("board-container")
        const board = document.createElement("div")
        board.id = "board"
        board.style.gridTemplateColumns = `repeat(${this.size}, 5vw)`
        board.style.gridTemplateRows = `repeat(${this.size}, 5vw)`
        boardContainer.appendChild(board)
        this.boardEl = board
        
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
        const players = this.selectedPlayers
        const density = this.density
        
        players.forEach(player => {
            if(size <= 7 && density === "sparse"){
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 1)
                this.assignPlayerToField(player, 1)
            } else if((size <= 7 && density === "medium")
                    || (size > 7 && density === "sparse")){
                this.assignPlayerToField(player, 3)
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 1)
                this.assignPlayerToField(player, 1)
            } else if((size <= 7 && density === "dense")
            || (size > 7 && density === "medium")){
                this.assignPlayerToField(player, 3)
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 1)
                this.assignPlayerToField(player, 1)
            } else if(size > 7 && density === "dense"){
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
        if(!this.error){
            this.currentPlayers = this.selectedPlayers
            this.remainingPlayers = this.currentPlayers
            this.playerOn = selectRandomElement(this.remainingPlayers)
            this.gameOn = true
            this.setIsOn()
            console.log("A new game has started")
        }
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
            this.remainingPlayers = this.remainingPlayers.filter(playerRemaining => playerRemaining.color !== player.color)
            if(this.remainingPlayers.length === 1){
                this.endGame()
            }    
        }    
    }    

    getNextPlayer(){
        if(this.gameOn){
            const currentIndex = this.remainingPlayers.indexOf(this.playerOn)
            const nextIndex = (currentIndex + 1) % this.remainingPlayers.length
            this.playerOn = this.remainingPlayers[nextIndex]
            this.setIsOn()
        }    
    }    
    
    endGame(){
        console.log(this.remainingPlayers[0].color + " has won!")
        this.playerOn = null
        this.gameOn = false
    }    
    
    computerMoves(){
        const selectedField = selectRandomElement(this.playerOn.fields)
        selectedField.selectField()
    }    
}    

// instantiating classes and starting a new game
const game = new Game()
game.getInput()
game.createBoard()

// helper functions
function selectRandomElement(arr){
    const index = Math.floor(arr.length * Math.random())
    const randomEl = arr[index]
    return randomEl
}

function getField(fields, row, col){
    return fields.find(field => field.row === row && field.col === col)
}
