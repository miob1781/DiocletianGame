import { BASE_URL } from "./consts.js"

const errorMessageWebGameEl = document.getElementById("web-game-error-message")

export class WebGame {
    constructor(playerId, playerName, creatorId, creatorName, numPlayers, size, density, humanPlayers, socket) {
        this.id = null
        this.status = null
        this.playerId = playerId
        this.playerName = playerName
        this.creatorId = creatorId
        this.creatorName = creatorName
        this.humanPlayers = humanPlayers
        this.numPlayers = numPlayers
        this.size = size
        this.density = density
        this.moves = null
        this.winner = null
        this.socket = socket
    }

    display(creatorName) {
        const webgameSection = document.createElement("section")
        webgameSection.id = this.id
        const textEl = document.createElement("p")

        textEl.innerHTML = `
            ${creatorName === this.playerName ? "You have created" : creatorName + " has invited you to"} a new game.<br>
            Number of players: ${this.numPlayers}<br>
            Size: ${this.size}<br>
            Density: ${this.density}<br>
            Other human players: ${this.humanPlayers.reduce((string, player) => {
                return string + player.name + ", "
            }, "").slice(0, -2)}<br>
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

            acceptButton.addEventListener("click", () => {
                this.socket.emit("accept", {
                    webGameId: this.id,
                    playerId: this.playerId
                })
            })

            declineButton.addEventListener("click", () => {
                this.socket.emit("decline", {
                    webGameId: this.id
                })
            })

            webgameSection.appendChild(acceptButton)
            webgameSection.appendChild(declineButton)
        }

        document.getElementById("web-games").appendChild(webgameSection)
        document.getElementById("web-games").style.display = "block"
        document.getElementById("create-game").style.display = "none"
        document.getElementById("display-container").style.display = "none"
        document.getElementById("board-container").style.display = "none"
    }

    getHeaders(storedToken) {
        return { Authorization: `Bearer ${storedToken}` }
    }

    postGame() {
        const storedToken = localStorage.getItem("authToken")
        const headers = this.getHeaders(storedToken)
        const playerIds = this.humanPlayers.map(player => player.id)

        const webGameData = {
            numPlayers: this.numPlayers,
            size: this.size,
            density: this.density,
            players: playerIds,
            creator: this.creatorId
        }

        axios.post(BASE_URL + "/game", webGameData, { headers })
        .then(response => {
            this.id = response.data.id
            this.status = "created"
            
            webGameData.players = this.humanPlayers
            webGameData.creator = {
                id: this.creatorId,
                name: this.creatorName
            }
    
            // sends the invitation to invited players
            this.socket.emit("game created", {
                webGameId: this.id,
                invitedPlayersIds: playerIds.filter(playerId => playerId !== this.creatorId),
                webGameData
            })
            
                // displays created webGame
                this.display(this.playerName)
            })
            .catch(err => {
                console.log("Error while creating web game: ", err)
                const message = err.response.data.errorMessage ? err.response.data.errorMessage : "Something has gone wrong."
                errorMessageWebGameEl.textContent = message
            })
    }
}