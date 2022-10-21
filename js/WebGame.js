import { BASE_URL } from "./consts.js"

const errorMessageWebGameEl = document.getElementById("web-game-error-message")

export class WebGame {
    constructor(playerId, playerName, creatorId, creatorName, numPlayers, size, density, humanPlayers, socket) {
        this.playerId = playerId
        this.playerName = playerName
        this.creatorId = creatorId
        this.creatorName = creatorName
        this.humanPlayers = humanPlayers
        this.numPlayers = numPlayers
        this.size = size
        this.density = density
        this.id = null
        this.status = null
        this.winner = null
        this.socket = socket
    }

    display() {
        const webGamesContainer = document.getElementById("web-games")

        for (const child of webGamesContainer.children) {
            if (!child.querySelector(".accept-invitation")) {
                child.remove()
            }
        }

        const webGameSection = document.createElement("section")
        webGameSection.id = this.id
        const textEl = document.createElement("p")
        const humanPlayersString = this.humanPlayers.reduce((string, player) => {
            return string + player.name + ", "
        }, "").slice(0, -2)

        textEl.innerHTML = `
            ${this.creatorName === this.playerName ? "You have created" : this.creatorName + " has invited you to"} a new game.<br>
            Number of players: ${this.numPlayers}<br>
            Size: ${this.size}<br>
            Density: ${this.density}<br>
            Human players: ${humanPlayersString}<br>
            ${this.creatorName === this.playerName ? "Waiting for players to join" : "Do you want to join?"}
            `
        webGameSection.appendChild(textEl)

        if (this.creatorName !== this.playerName) {
            const acceptButton = document.createElement("button")
            acceptButton.className = "accept-invitation"
            acceptButton.type = "button"
            acceptButton.textContent = "Join!"

            const declineButton = document.createElement("button")
            declineButton.className = "decline-invitation"
            declineButton.type = "button"
            declineButton.textContent = "Decline"

            acceptButton.addEventListener("click", () => {
                this.socket.emit("accept", {
                    webGameId: this.id,
                    playerId: this.playerId
                })

                textEl.textContent = "The game will start soon."
                acceptButton.remove()
                declineButton.remove()
            })

            declineButton.addEventListener("click", () => {
                this.socket.emit("decline", {
                    webGameId: this.id,
                    playerName: this.playerName
                })

                textEl.textContent = "You have declined to participate in the game."
                acceptButton.remove()
                declineButton.remove()

                this.deleteGame()
            })

            webGameSection.appendChild(acceptButton)
            webGameSection.appendChild(declineButton)

        } else {
            const revokeButton = document.createElement("button")
            revokeButton.className = "revoke-invitation"
            revokeButton.type = "button"
            revokeButton.textContent = "Revoke invitation"

            revokeButton.addEventListener("click", () => {
                this.socket.emit("revoke", {
                    webGameId: this.id
                })

                this.deleteGame()

                textEl.textContent = "You have revoked the invitation."
                revokeButton.remove()
            })

            webGameSection.appendChild(revokeButton)

            document.getElementById("display-container").style.display = "none"
            document.getElementById("board-container").style.display = "none"
        }

        webGamesContainer.appendChild(webGameSection)
        webGamesContainer.style.display = "block"
        document.getElementById("create-game").style.display = "none"
        errorMessageWebGameEl.textContent = ""
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
                this.display()
            })
            .catch(err => {
                console.log("Error while creating web game: ", err)
                const message = err.response?.data?.errorMessage ? err.response?.data?.errorMessage : "Something has gone wrong."
                errorMessageWebGameEl.textContent = message
            })
    }

    deleteGame() {
        const storedToken = localStorage.getItem("storedToken")
        const headers = this.getHeaders(storedToken)

        axios.delete(BASE_URL + "/game/" + this.id, { headers })
            .catch(err => {
                console.log("Error while deleting web game: ", err)
            })
    }
}