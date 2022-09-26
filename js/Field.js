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
    
    setField(player, value){
        this.player = player
        this.player.fields.push(this)
        this.value = value
        this.numEl.textContent = this.value
        this.fieldEl.style.backgroundColor = styles.backgroundColor[this.player.color]
        this.fieldEl.style.color = styles.color[this.player.color]
        this.numEl.style.fontSize = styles.fontSize[this.value.toFixed()]
    }
    
    selectField(){
        if(this.player.isOn){
            this.player.isOn = false
            this.increaseValue()
            this.game.currentPlayers.forEach(player => player.getPlayerValues())
            this.game.getNextPlayer()
        }    
    }    
    
    increaseValue(){
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
