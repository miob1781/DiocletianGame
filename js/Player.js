export class Player {
    constructor(color){
        this.color = color
        this.isOn = false
        this.isComputer = false
        this.fields = []
        this.displayPlayerEl = null
    }    

    appendField(field){
        this.fields.push(field)
    }    
}    
