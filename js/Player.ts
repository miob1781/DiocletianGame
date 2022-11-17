import { backgroundColor, color } from "./styles"
import { Color, FieldT, PlayerT } from "./types.js"

export class Player implements PlayerT {
    color: Color
    name: Color
    isOn: boolean
    isComputer: boolean
    isExternalPlayer: boolean
    fields: FieldT[]
    totalValue: number
    playerDisplayEl: HTMLElement | null

    constructor(color: Color) {
        this.color = color
        this.name = color
        this.isOn = false
        this.isComputer = true
        this.isExternalPlayer = false
        this.fields = []
        this.totalValue = 0
        this.playerDisplayEl = null
    }

    // adds display for participating players and their values
    setPlayerDisplayEl() {
        const playerDisplayEl = document.createElement("div")
        playerDisplayEl.className = "display-player"
        playerDisplayEl.style.backgroundColor = backgroundColor[this.color]
        playerDisplayEl.style.color = color[this.color]

        const playerNameEl = document.createElement("p")
        const playerFieldsNumEl = document.createElement("p")
        const playerFieldsValueEl = document.createElement("p")

        playerNameEl.className = "player-name"
        playerFieldsNumEl.className = "player-num"
        playerFieldsValueEl.className = "player-value"

        playerNameEl.textContent = this.name

        playerDisplayEl.appendChild(playerNameEl)
        playerDisplayEl.appendChild(playerFieldsNumEl)
        playerDisplayEl.appendChild(playerFieldsValueEl)

        this.playerDisplayEl = playerDisplayEl
    }

    // calculates the number of fields and the total number of field values of a player
    getPlayerValues() {
        const playerFieldsNumEl = this.playerDisplayEl!.querySelector(".player-num")!
        const playerFieldsValueEl = this.playerDisplayEl!.querySelector(".player-value")!

        playerFieldsNumEl.textContent = "Fields: " + this.fields.length

        const totalValue: number = this.fields.reduce((acc: number, curr: FieldT): number => {
            return acc + curr.value
        }, 0)

        playerFieldsValueEl.textContent = "Value: " + totalValue
        this.totalValue = totalValue
    }
}    
