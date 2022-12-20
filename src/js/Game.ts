import axios from "axios";
import { Socket } from "socket.io-client"
import { BASE_URL } from "./consts"
import { Field } from "./Field"
import { Player } from "./Player"
import { selectRandomElement, shuffleArray } from "./helper_functions"
import { Color, Density, FieldT, GameT, HeadersT, Move, PlayerT } from "./types"

const displayContainer = document.getElementById("display-container")!
const boardContainer = document.getElementById("board-container")!
const winnerMessageEl = document.getElementById("winner-message")!

export class Game implements GameT {
    numPlayers: number
    size: number
    density: Density
    humanPlayersNames: string[]
    username: string
    webGameId: string | null
    socket: Socket | null
    fields: FieldT[]
    selectedPlayers: PlayerT[]
    remainingPlayers: PlayerT[]
    moves: Move[]
    playerOn: PlayerT | null
    moveNum: number
    gameOn: boolean
    playerIsCreator: boolean

    constructor(
        numPlayers: number,
        size: number,
        density: Density,
        humanPlayersNames: string[],
        username: string | null = null,
        webGameId: string | null = null,
        socket: Socket | null = null
    ) {
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
        const colors: Color[] = Object.values(Color)
        for (let i: number = 0; i < this.numPlayers; i++) {
            const player: PlayerT = new Player(colors[i])

            if (!this.webGameId) {
                if (this.humanPlayersNames.includes(colors[i])) {
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
        let k: number = 0
        for (let i: number = 1; i <= this.size; i++) {
            for (let j: number = 1; j <= this.size; j++) {
                const col: number = i
                const row: number = j
                const id: number = k
                k++

                const field: FieldT = new Field(id, row, col)
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
            if (this.size <= 7 && this.density === Density.Sparse) {
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 1)
                this.assignPlayerToField(player, 1)

            } else if (
                (this.size <= 7 && this.density === Density.Medium) ||
                (this.size > 7 && this.density === Density.Sparse)
            ) {
                this.assignPlayerToField(player, 3)
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 1)
                this.assignPlayerToField(player, 1)

            } else if (
                (this.size <= 7 && this.density === Density.Sparse) ||
                (this.size > 7 && this.density === Density.Medium)
            ) {
                this.assignPlayerToField(player, 3)
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 2)
                this.assignPlayerToField(player, 1)
                this.assignPlayerToField(player, 1)

            } else if (this.size > 7 && this.density === Density.Dense) {
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
    assignPlayerToField(player: PlayerT, value: number) {
        let index: number, field: FieldT

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
            displayEl.appendChild(player.playerDisplayEl!)
            player.getPlayerValues()
        })

        displayContainer.style.display = "block"
    }

    // starts a new game
    start() {
        winnerMessageEl.textContent = ""

        this.remainingPlayers = this.selectedPlayers
        this.playerOn = this.remainingPlayers[0]
        this.gameOn = true
        this.setIsOn()

        document.getElementById("display")!.style.display = "flex"
        document.getElementById("board")!.style.display = "grid"

        for (const id of ["create-game", "web-games"]) {
            document.getElementById(id)!.style.display = "none"
        }
    }

    // sets a player on so that the player can move
    setIsOn(move?: number) {
        this.playerOn!.isOn = true
        this.playerOn!.playerDisplayEl!.style.border = "4px dashed gold"

        let selectedField: FieldT
        if (typeof move === "number") {
            selectedField = this.fields.find(field => field.id === move)!
            selectedField.selectField()
        } else if (this.playerOn!.isComputer && this.playerIsCreator) {
            selectedField = selectRandomElement(this.playerOn!.fields)
            selectedField.selectField()
        }
    }

    // moves on to the next player
    getNextPlayer() {
        if (this.gameOn) {
            this.playerOn!.playerDisplayEl!.style.border = "none"
            const currentIndex: number = this.remainingPlayers.indexOf(this.playerOn!)
            const nextIndex: number = (currentIndex + 1) % this.remainingPlayers.length
            this.playerOn = this.remainingPlayers[nextIndex]
            this.setIsOn()
        }
    }

    // checks if a player has run out of fields and has thus left the game and if the game has ended
    checkRemainingPlayers(player: PlayerT) {
        if (player.fields.length === 0) {
            this.remainingPlayers = this.remainingPlayers.filter(playerRemaining => playerRemaining.color !== player.color)

            if (this.remainingPlayers.length === 1) {
                this.end()
            }
        }
    }

    // performs final actions when a game has ended
    end() {
        const winnerName: string = this.remainingPlayers[0].name

        if (this.webGameId && this.playerIsCreator) {
            const storedToken: string = localStorage.getItem("authToken")!
            const headers: HeadersT = { Authorization: `Bearer ${storedToken}` }
            const winner: string = this.remainingPlayers[0].isComputer ? "computer" : winnerName

            axios.put(BASE_URL + "/game/" + this.webGameId, { winner }, { headers })
                .then(() => console.log("game has ended"))
                .catch((err: unknown) => console.log("error while updating game: ", err))
        }

        winnerMessageEl.textContent = winnerName === "You" ? winnerName + " have won!" : winnerName + " has won!"

        this.gameOn = false
    }
}
