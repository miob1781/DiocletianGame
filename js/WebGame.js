import { BASE_URL } from "./consts.js"

export class WebGame {
    constructor(player, numPlayers, size, density, invitedPlayers, socket){
        this.id = null
        this.status = null
        this.player = player
        this.numPlayers = numPlayers
        this.invitedPlayers = invitedPlayers
        this.size = size
        this.density = density
        this.moves = null
        this.winner = null
        this.socket = socket
    }

    postGame(){
        axios.post(BASE_URL + "/game")
            .then(response => {
                this.id = response.data.id
                this.status = "created"

                // sends the invitation to invited players
                this.socket.emit("game created", {
                    id: this.id,
                    player: this.player,
                    numPlayers: this.numPlayers,
                    invitedPlayers: this.invitedPlayers,
                    size: this.size,
                    density: this.density
                })
            })
    }
}