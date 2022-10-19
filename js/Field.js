import {styles} from "./styles.js"
import {getField} from "./helper_functions.js" 

export class Field {
    constructor(id, row, col){
        this.fieldEl = null
        this.numEl = null
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
    
    setField(player, value) {
        if (this.player && this.player.color !== player.color) {
            this.player.filter(field => field.id !== this.id)
        }
        
        this.player = player ? player : null

        if (this.player) {
            this.player.fields.push(this)
            this.value = value
            this.numEl.textContent = this.value
            this.fieldEl.style.backgroundColor = styles.backgroundColor[this.player.color]
            this.fieldEl.style.color = styles.color[this.player.color]
            this.numEl.style.fontSize = styles.fontSize[this.value.toFixed()]
        } else {
            this.value = 0
            this.numEl.textContent = ""
            this.fieldEl.style.backgroundColor = styles.backgroundColor.free
            this.fieldEl.style.color = "unset"
            this.numEl.style.fontSize = "unset"
        }
    }
    
    selectField(clicking) {
        if (!this.player) return
        if (clicking && (this.player.isComputer || this.player.isExternalPlayer)) return

        if (this.player.isOn) {
            this.player.isOn = false
            this.increaseValue()
            this.game.selectedPlayers.forEach(player => player.getPlayerValues())

            if (this.game.webGameId && ((!this.game.playerOn.isComputer && !this.game.playerOn.isExternalPlayer) || (this.game.playerIsCreator && this.player.isComputer))) {
                this.game.socket.emit("move", { webGameId: this.game.webGameId, move: this.id, playerOnColor: this.player.color })
            }
            
            this.game.getNextPlayer()
        }    
    }    
    
    increaseValue() {
        if(!this.game.gameOn){
            return
        }
        this.value++
        this.numEl.textContent = this.value
        this.numEl.style.fontSize = styles.fontSize[this.value.toFixed()]
        if(this.value > this.neighbors.length){
            this.overflow()
        }    
    }    
    
    overflow(){
        this.value = 1
        this.numEl.textContent = 1
        this.numEl.style.fontSize = styles.fontSize["1"]
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
