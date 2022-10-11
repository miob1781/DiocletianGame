import { BASE_URL } from "./consts.js"

const errorMessageWebGameEl = document.getElementById("web-game-error-message")

export class WebGame {
    constructor(playerId, playerName, creatorId, creatorName, numPlayers, size, density, otherPlayers, socket){
        this.id = null
        this.status = null
        this.playerId = playerId
        this.playerName = playerName
        this.creatorId = creatorId
        this.creatorName = creatorName
        this.numPlayers = numPlayers
        this.otherPlayers = otherPlayers
        this.size = size
        this.density = density
        this.moves = null
        this.winner = null
        this.socket = socket
    }

    display(creatorName){
        const webgameSection = document.createElement("section")
        const textEl = document.createElement("p")

        textEl.textContent = `
            ${creatorName === this.playerName ? "You have" : creatorName + " has"} created a new game.<br>
            Number of players: ${this.numPlayers}<br>
            Size: ${this.size}<br>
            Density: ${this.density}<br>
            Other human players: ${this.otherPlayers}<br>
            ${creatorName === this.playerName ? "Waiting for other players to join" : "Do you want to join?"}
        `

        webgameSection.appendChild(textEl)
        
        if (creatorName !== this.playerName) {
            const acceptButton = document.createElement("button")
            const declineButton = document.createElement("button")

            acceptButton.id = "accept-invitation"
            acceptButton.type = "button"
            acceptButton.textContent = "Join!"

            declineButton.id = "decline-invitation"
            declineButton.type = "button"
            declineButton.textContent = "Decline"

            webgameSection.appendChild(acceptButton)
            webgameSection.appendChild(declineButton)
        }

        document.getElementById("web-games").appendChild(webgameSection)
    }

    getHeaders(storedToken){
        return {Authorization: `Bearer ${storedToken}`}
    }

    postGame(){
        const storedToken = localStorage.getItem("authToken")
        const headers = this.getHeaders(storedToken)

        axios.post(BASE_URL + "/game", {
            numPlayers: this.numPlayers,
            size: this.size,
            density: this.density,
            players: [...this.otherPlayers, this.playerId],
            creator: this.playerId
        }, { headers })
            .then(response => {
                this.id = response.data.id
                this.status = "created"

                // sends the invitation to invited players
                this.socket.emit("game created", {
                    webGameId: this.id,
                    invitedPlayers: this.otherPlayers
                })

                // displays created webGame
                this.display(this.playerId)
            })
            .catch(err => {
                console.log("Error while creating web game: ", err)
                const message = err.response.data.errorMessage ? err.response.data.errorMessage : "Something has gone wrong."
                errorMessageWebGameEl.textContent = message    
            })
    }
}