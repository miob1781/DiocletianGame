export class Player {
    constructor(color){
        this.color = color
        this.isOn = false
        this.isComputer = false
        this.fields = []
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
        playerFieldsNumEl.textContent = this.fields.length
        playerFieldsValueEl.textContent = this.fields.reduce((acc, curr) => {
            console.log(this.fields)
            console.log("acc" + acc, typeof acc, "curr" + curr.value, typeof curr.value)
            return acc + curr.value
        }, 0)

    }
}    
