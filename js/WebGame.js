

export class WebGame {
    constructor(player, numPlayers, invitedPlayers, size, density){
        this.status = "created"
        this.player = player
        this.numPlayers = numPlayers
        this.invitedPlayers = invitedPlayers
        this.size = size
        this.density = density
        this.moves = null
        this.winner = null
    }
}