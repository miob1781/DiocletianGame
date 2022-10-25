import { BASE_URL } from "./consts.js"

const webGamesContainer = document.getElementById("web-games")
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
        this.socket = socket
    }

    // displays the messages and buttons to start a new game on the web
    display() {
        const webGameSection = document.createElement("section")
        webGameSection.id = this.id
        const textEl = document.createElement("p")
        textEl.className = "dark"
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
        webGameSection.replaceChildren(textEl)

        // displays buttons specific to the creator of a game
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

        // displays button specific to the invited players
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

        // final actions for all players
        webGamesContainer.replaceChildren(webGameSection)
        webGamesContainer.style.display = "block"
        document.getElementById("create-game").style.display = "none"
        errorMessageWebGameEl.textContent = ""
    }

    // gets the header values for authentication
    getHeaders(storedToken) {
        return { Authorization: `Bearer ${storedToken}` }
    }

    // posts a new web game
    postGame() {
        const storedToken = localStorage.getItem("authToken")
        const headers = this.getHeaders(storedToken)
        const playerIds = this.humanPlayers.map(player => player.id)

        // error handler if no players is invited
        if (playerIds.length < 2) {
            return errorMessageWebGameEl.textContent = "You must invite a player."
        }

        // error handler if too many players are invited
        if (playerIds.length > this.numPlayers) {
            return errorMessageWebGameEl.textContent = "You have invited too many players."
        }

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

                this.display()
            })
            .catch(err => {
                console.log("Error while creating web game: ", err)
                const message = err.response?.data?.errorMessage ? err.response?.data?.errorMessage : "Something has gone wrong."
                errorMessageWebGameEl.textContent = message
            })
    }

    // deletes a web game when a player declined to participate or the creator revoked the invitation
    deleteGame() {
        const storedToken = localStorage.getItem("storedToken")
        const headers = this.getHeaders(storedToken)

        axios.delete(BASE_URL + "/game/" + this.id, { headers })
            .catch(err => {
                console.log("Error while deleting web game: ", err)
            })
    }
}