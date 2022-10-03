import { styles } from "./styles.js"

export class Player {
    constructor(color){
        this.color = color
        this.isOn = false
        this.isComputer = true
        this.isExternalPlayer = false
        this.fields = []
        this.totalValue = 0
        this.playerDisplayEl = null
    }    

    setPlayerDisplayEl(username){
        const playerDisplayEl = document.createElement("div")
        playerDisplayEl.className = "display-player"
        playerDisplayEl.style.backgroundColor = styles.backgroundColor[this.color]
        playerDisplayEl.style.color = styles.color[this.color]

        const playerNameEl = document.createElement("p")
        const playerFieldsNumEl = document.createElement("p")
        const playerFieldsValueEl = document.createElement("p")

        playerNameEl.className = "player-name"
        playerFieldsNumEl.className = "player-num"
        playerFieldsValueEl.className = "player-value"

        // displays username if username is provided
        playerNameEl.textContent = username ? username : this.color

        playerDisplayEl.appendChild(playerNameEl)
        playerDisplayEl.appendChild(playerFieldsNumEl)
        playerDisplayEl.appendChild(playerFieldsValueEl)

        this.playerDisplayEl = playerDisplayEl
    }
    
    getPlayerValues(){
        const playerFieldsNumEl = this.playerDisplayEl.querySelector(".player-num")
        const playerFieldsValueEl = this.playerDisplayEl.querySelector(".player-value")

        playerFieldsNumEl.textContent = "Fields: " + this.fields.length

        const totalValue = this.fields.reduce((acc, curr) => {
            return acc + curr.value
        }, 0)
        playerFieldsValueEl.textContent = "Value: " + totalValue
        this.totalValue = totalValue
    }
}    
