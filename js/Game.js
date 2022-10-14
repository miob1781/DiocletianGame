import {playerColors} from "./consts.js"
import {Field} from "./Field.js"
import {Player} from "./Player.js"
import {selectRandomElement, shuffleArray} from "./helper_functions.js" 

export class Game {
    constructor(numPlayers, size, density, humanPlayers, username=null, socket=null, webGameId=null, creatorId=null) {
        this.boardEl = document.getElementById("board")
        this.displayEl = document.getElementById("display")
        this.numPlayers = numPlayers
        this.size = size
        this.humanPlayers = humanPlayers
        this.username = username ? username : "You"
        this.webGameId = webGameId
        this.creatorId = creatorId
        this.socket = socket
        this.selectedPlayers = []
        this.density = density
        this.fields = []
        this.currentPlayers = []
        this.remainingPlayers = []
        this.playerOn = null
        this.gameOn = false
    }
    
    createBoard() {
        for (let i=0; i<this.numPlayers; i++) {
            const player = new Player(playerColors[i])
            
            if (!this.webGameId) {
                if (this.humanPlayers.includes(playerColors[i])) {
                    player.isComputer = false

                    if (this.humanPlayers.length === 1) {
                        player.name = this.username
                    }
                }
            } else {
                if (i < this.humanPlayers.length) {
                    player.name = this.humanPlayers[i]
                    player.isComputer = false

                    if (player.name !== this.username) {
                        player.isExternalPlayer = true
                    }
                }
            }

            this.selectedPlayers.push(player)
        }
        
        // shuffles the selected players by the Fisher-Yates algorithm
        this.selectedPlayers = shuffleArray(this.selectedPlayers)

        this.fields = []
        this.selectedPlayers.forEach(player => player.fields = [])
        
        this.boardEl.remove()
        const boardContainer = document.getElementById("board-container")
        const boardEl = document.createElement("div")
        boardEl.id = "board"
        boardContainer.appendChild(boardEl)
        this.boardEl = boardEl

        boardEl.style.width = `min(${this.size * 50}px, 90vw)`
        boardEl.style.height = `min(${this.size * 50}px, 90vw)`
        boardEl.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`
        boardEl.style.gridTemplateRows = `repeat(${this.size}, 1fr)`

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
                                
                fieldEl.addEventListener("click", () => {
                    field.selectField()
                })
                
                this.boardEl.appendChild(fieldEl)

                const numEl = document.createElement("span")
                numEl.className = "num"
                fieldEl.appendChild(numEl)
                
                field.game = this
                this.fields.push(field)
                field.fieldEl = fieldEl
                field.numEl = numEl
            }
        }

        this.fields.forEach(field => field.getNeighbors())
        this.addPlayers()
        this.createDisplay()
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

    createDisplay(){
        this.displayEl.remove()
        const displayContainer = document.getElementById("display-container")
        const displayEl = document.createElement("display")
        displayEl.id = "display"
        displayContainer.appendChild(displayEl)

        this.selectedPlayers.forEach(player => {
            player.setPlayerDisplayEl()
            displayEl.appendChild(player.playerDisplayEl)
            player.getPlayerValues()
        })

        this.displayEl = displayEl
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
        const winnerMessageEl = document.getElementById("winner-message")
        winnerMessageEl.textContent = ""

        this.currentPlayers = this.selectedPlayers
        this.remainingPlayers = this.currentPlayers
        this.playerOn = this.remainingPlayers[0]
        this.gameOn = true
        this.setIsOn()

        // closes unnecessary elements
        for (const id of ["create-game", "web-games", "old-games"]) {
            document.getElementById(id).style.display = "none"
        }
    }

    setIsOn(){
        this.playerOn.isOn = true
        this.playerOn.playerDisplayEl.style.border = "4px dashed gold"
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
            this.playerOn.playerDisplayEl.style.border = "none"
            const currentIndex = this.remainingPlayers.indexOf(this.playerOn)
            const nextIndex = (currentIndex + 1) % this.remainingPlayers.length
            this.playerOn = this.remainingPlayers[nextIndex]
            this.setIsOn()
        }    
    }    

    endGame(){
        const winnerMessageEl = document.getElementById("winner-message")
        const winner = this.remainingPlayers[0].name

        winnerMessageEl.textContent = winner === "You" ? winner + " have won!" : winner + " has won!"

        this.playerOn = null
        this.gameOn = false
    }    

    computerMoves(){
        const selectedField = selectRandomElement(this.playerOn.fields)
        selectedField.selectField()
    }    
}
