export class Player {
    constructor(color){
        this.color = color
        this.isOn = false
        this.isComputer = false
        this.fields = []
        this.totalValue = 0
        this.playerDisplayEl = null
    }    

    appendField(field){
        this.fields.push(field)
    }
    
    getPlayerValues(){
        const playerNameEl = this.playerDisplayEl.querySelector(".player-name")
        const playerFieldsNumEl = this.playerDisplayEl.querySelector(".player-num")
        const playerFieldsValueEl = this.playerDisplayEl.querySelector(".player-value")
        playerNameEl.textContent = this.color
        playerFieldsNumEl.textContent = "Fields: " + this.fields.length
        const totalValue = this.fields.reduce((acc, curr) => {
            return acc + curr.value
        }, 0)
        playerFieldsValueEl.textContent = "Value: " + totalValue
        this.totalValue = totalValue
    }
}    
