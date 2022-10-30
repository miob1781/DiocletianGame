import { BASE_URL, playerColors } from "./consts.js"
import { Field } from "./Field.js"
import { Player } from "./Player.js"
import { selectRandomElement, shuffleArray } from "./helper_functions.js"

const displayContainer = document.getElementById("display-container")
const boardContainer = document.getElementById("board-container")
const winnerMessageEl = document.getElementById("winner-message")

export class Game {
    constructor(numPlayers, size, density, humanPlayersNames, username = null, webGameId = null, socket = null) {
        this.numPlayers = numPlayers
        this.size = size
        this.density = density
        this.humanPlayersNames = humanPlayersNames
        this.username = username ? username : "You"
        this.webGameId = webGameId
        this.socket = socket
        this.fields = []
        this.selectedPlayers = []
        this.remainingPlayers = []
        this.moves = []
        this.playerOn = null
        this.moveNum = 0
        this.gameOn = false
        this.playerIsCreator = true
    }

    // creates the board for a new game
    createBoard() {

        // sets the participating players
        for (let i = 0; i < this.numPlayers; i++) {
            const player = new Player(playerColors[i])

            if (!this.webGameId) {
                if (this.humanPlayersNames.includes(playerColors[i])) {
                    player.isComputer = false

                    if (this.humanPlayersNames.length === 1) {
                        player.name = this.username
                    }
                }

            } else {
                if (i < this.humanPlayersNames.length) {
                    player.name = this.humanPlayersNames[i]
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

        // creates a new board element and sets its grid
        const boardEl = document.createElement("div")
        boardEl.id = "board"
        boardEl.style.width = `min(${this.size * 50}px, 90vw)`
        boardEl.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`
        boardEl.style.gridTemplateRows = `repeat(${this.size}, 1fr)`

        // creates the fields of the board
        let k = 0
        for (let i = 1; i <= this.size; i++) {
            for (let j = 1; j <= this.size; j++) {
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
                    field.selectField("clicking")
                })

                const numEl = document.createElement("span")
                numEl.className = "num"
                fieldEl.appendChild(numEl)
                field.game = this
                field.fieldEl = fieldEl
                field.numEl = numEl

                this.fields.push(field)
                boardEl.appendChild(fieldEl)
            }
        }

        // assigns neighbors and players to fields
        this.fields.forEach(field => field.getNeighbors())
        this.addPlayers()

        // replaces the olds board element and displays it
        boardContainer.replaceChildren(boardEl)
        boardContainer.style.display = "block"
    }

    // adds players and values to fields
    addPlayers() {
        this.selectedPlayers.forEach(player => {
            if (this.size <= 7 && this.density === "sparse") {
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 1)
                this.assignPlayerToField(player, 1)

            } else if (
                (this.size <= 7 && this.density === "medium") ||
                (this.size > 7 && this.density === "sparse")
            ) {
                this.assignPlayerToField(player, 3)
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 1)
                this.assignPlayerToField(player, 1)

            } else if (
                (this.size <= 7 && this.density === "dense") ||
                (this.size > 7 && this.density === "medium")
            ) {
                this.assignPlayerToField(player, 3)
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 1)
                this.assignPlayerToField(player, 1)

            } else if (this.size > 7 && this.density === "dense") {
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

    // assigns player to a field
    assignPlayerToField(player, value) {
        let index, field

        do {
            index = Math.floor(this.fields.length * Math.random())
            field = this.fields[index]
        } while (field.player || field.neighbors.length - value < 1)

        field.setField(player, value)
    }

    // creates the display for a new game
    createDisplay() {
        const displayEl = document.createElement("display")
        displayEl.id = "display"
        displayContainer.replaceChildren(displayEl)

        this.selectedPlayers.forEach(player => {
            player.setPlayerDisplayEl()
            displayEl.appendChild(player.playerDisplayEl)
            player.getPlayerValues()
        })

        displayContainer.style.display = "block"
    }

    // starts a game
    start() {
        winnerMessageEl.textContent = ""

        this.remainingPlayers = this.selectedPlayers
        this.playerOn = this.remainingPlayers[0]
        this.gameOn = true
        this.setIsOn()

        document.getElementById("display").style.display = "flex"
        document.getElementById("board").style.display = "grid"

        for (const id of ["create-game", "web-games"]) {
            document.getElementById(id).style.display = "none"
        }
    }

    // sets a player on so that the player can move
    setIsOn(fieldId) {
        this.playerOn.isOn = true
        this.playerOn.playerDisplayEl.style.border = "4px dashed gold"

        if (typeof fieldId === "number") {
            const selectedField = this.fields.find(field => field.id === fieldId)
            selectedField.selectField()
        } else if (this.playerOn.isComputer && this.playerIsCreator) {
            const selectedField = selectRandomElement(this.playerOn.fields)
            selectedField.selectField()
        }
    }

    // moves on to the next player
    getNextPlayer() {
        if (this.gameOn) {
            this.playerOn.playerDisplayEl.style.border = "none"
            const currentIndex = this.remainingPlayers.indexOf(this.playerOn)
            const nextIndex = (currentIndex + 1) % this.remainingPlayers.length
            this.playerOn = this.remainingPlayers[nextIndex]
            this.setIsOn()
        }
    }

    // checks if a player has run out of fields and has thus left the game and if the game has ended
    checkRemainingPlayers(player) {
        if (player.fields.length === 0) {
            this.remainingPlayers = this.remainingPlayers.filter(playerRemaining => playerRemaining.color !== player.color)

            if (this.remainingPlayers.length === 1) {
                this.end()
            }
        }
    }

    // performs final actions when a game has ended
    end() {
        const winnerName = this.remainingPlayers[0].name

        if (this.webGameId && this.playerIsCreator) {
            const storedToken = localStorage.getItem("authToken")
            const headers = { Authorization: `Bearer ${storedToken}` }
            const winner = this.remainingPlayers[0].isComputer ? "computer" : winnerName

            axios.put(BASE_URL + "/game/" + this.webGameId, { winner }, { headers })
                .then(() => console.log("game has ended"))
                .catch(err => console.log("error while updating game: ", err))

            this.socket.emit("end", { webGameId: this.webGameId })
        }

        winnerMessageEl.textContent = winnerName === "You" ? winnerName + " have won!" : winnerName + " has won!"

        this.gameOn = false
    }
}
