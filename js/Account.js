import { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js";
import { Game } from "./Game.js"
import { WebGame } from "./WebGame.js"
import { BASE_URL } from "./consts.js"

// elements in #account
const signupContainer = document.getElementById("signup")
const loginContainer = document.getElementById("login")
const logoutButton = document.getElementById("logout")
const errorMessageAccountEl = document.getElementById("error-message-account")
const webGameButton = document.getElementById("web-game-button")
const rulesButton = document.getElementById("rules-button")
const playerNameHeading = document.getElementById("player-name")
const createGameContainer = document.getElementById("create-game")
const soloIntroEl = document.getElementById("intro-solo")
const webIntroEl = document.getElementById("intro-web")
const numPlayersInput = document.getElementById("num-players-input")
const sizeInput = document.getElementById("size-input")
const densityInput = document.getElementById("density-input")
const getPlayerContainer = document.getElementById("get-player")
const errorMessagePlayerEl = document.getElementById("error-message-get-player")
const humanPlayersContainer = document.getElementById("human-players")
const colorsContainer = document.getElementById("colors")
const redCheckboxContainer = document.getElementById("red")
const blueCheckboxContainer = document.getElementById("blue")
const yellowCheckboxContainer = document.getElementById("yellow")
const greenCheckboxContainer = document.getElementById("green")
const orangeCheckboxContainer = document.getElementById("orange")
const purpleCheckboxContainer = document.getElementById("purple")
const submitGameButton = document.getElementById("submit-game")
const errorMessageCreateGameEl = document.getElementById("error-message-create-game")
const rulesEl = document.getElementById("rules")

export class Account {
    constructor() {
        this.id = null
        this.username = null
        this.invitedPlayers = []
        this.connectedPlayers = null
        this.createdGame = null
        this.invitedGames = null
        this.oldGames = null
        this.gameType = null
        this.socket = null
        this.webGame = null
        this.game = null
        this.isLoggedIn = localStorage.getItem("authToken") ? true : false
    }

    // hides or opens elements during authentication depending on whether the player is logged in
    hideOrOpen() {
        if (this.isLoggedIn) {
            loginContainer.style.display = "none"
            signupContainer.style.display = "none"
            logoutButton.style.display = "unset"
            webGameButton.style.display = "unset"
            playerNameHeading.style.display = "block"
            playerNameHeading.textContent = `Welcome, ${this.username}!`
            getPlayerContainer.style.display = "block"
            colorsContainer.style.display = "none"
            submitGameButton.textContent = "Send Invitation"
            this.gameType = "web"

        } else {
            loginContainer.style.display = "block"
            logoutButton.style.display = "none"
            webGameButton.style.display = "none"
            playerNameHeading.style.display = "none"
            getPlayerContainer.style.display = "none"
            colorsContainer.style.display = "block"
            submitGameButton.textContent = "Start Solo Game"
            this.gameType = "solo"
        }
    }

    // gets header values for authentication
    getHeaders(storedToken) {
        return { Authorization: `Bearer ${storedToken}` }
    }

    // loads the values of old games to get the connected players, the games open for partipation and the number of games played and won
    loadGames() {
        const storedToken = localStorage.getItem("authToken")
        const headers = this.getHeaders(storedToken)

        axios.get(BASE_URL + "/game/", { headers, params: { playerId: this.id } })
            .then(response => {
                const { connectedPlayers, gamesCreated, numGamesFinished, numGamesWon } = response.data

                webIntroEl.textContent = `You have played ${numGamesFinished} game${numGamesFinished === 1 ? "" : "s"} on the web and have won ${numGamesWon} of them. Try another one?`

                gamesCreated.forEach(gameLoaded => {
                    const { id, numPlayers, size, density, players, creator } = gameLoaded

                    this.webGame = new WebGame(this.id, this.username, creator.id, creator.name, numPlayers, size, density, players, this.socket)
                    this.webGame.id = id
                    this.webGame.display()

                    this.socket.emit("join room", { webGameId: id })
                })

                connectedPlayers.forEach(player => {
                    const optionEl = document.createElement("option")
                    optionEl.value = player.name
                    document.getElementById("players-list").appendChild(optionEl)
                })

                this.connectedPlayers = connectedPlayers
            })
            .catch(err => {
                console.log("error while loading games: ", err);
            })
    }

    // starts a new game with default values after authentication
    startGame() {
        const game = new Game(4, 6, "sparse", ["red"], this.username)
        game.createBoard()
        game.createDisplay()
        game.start()
    }

    // handles logout
    logout() {
        localStorage.removeItem("authToken")
        this.id = null
        this.username = null
        this.invitedPlayers = []
        this.createdGame = null
        this.invitedGames = null
        this.oldGames = null
        this.gameType = null
        this.game = null
        this.isLoggedIn = false

        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
        }

        this.hideOrOpen()
        this.startGame()
    }

    // authenticates a user and performs actions after authentication
    authenticateUser() {
        const storedToken = localStorage.getItem("authToken")
        if (storedToken) {
            const headers = this.getHeaders(storedToken)

            axios.get(BASE_URL + "/player/verify", { headers })
                .then(response => {
                    const { id, username, createdGame, invitedGames, oldGames } = response.data

                    this.id = id
                    this.username = username
                    this.createdGame = createdGame
                    this.invitedGames = invitedGames
                    this.oldGames = oldGames
                    this.isLoggedIn = true

                    // controls display
                    this.hideOrOpen()

                    // starts game after authentication
                    this.startGame()

                    // starts websocket
                    this.socket = io(BASE_URL, { withCredentials: true })
                    this.addSocketListeners()

                    // loads web games
                    this.loadGames()
                })
                .catch(err => {
                    console.log("Error during authentication: ", err)
                    this.logout()
                })
        }
        else {
            // starts game if not logged in
            this.startGame()
        }
    }

    // function used during authentication for either login or signup
    handleLoginOrSignupRequest(url, data) {
        axios.post(url, data)
            .then(response => {
                localStorage.setItem("authToken", response.data.authToken)
                this.authenticateUser()
                errorMessageAccountEl.textContent = ""
            })
            .catch(err => {
                console.log("Error: ", err)
                const message = err.response?.data?.errorMessage ? err.response?.data?.errorMessage : "Something has gone wrong."
                errorMessageAccountEl.textContent = message
            })
    }

    // displays invited players for a web game
    displayInvitedPlayers() {
        const playersString = this.invitedPlayers.reduce((currString, player) => {
            return currString + player.name + ", "
        }, "Invited players: ").slice(0, -2)

        const playerNamesEl = document.createElement("p")
        playerNamesEl.className = "dark"
        playerNamesEl.textContent = playersString
        humanPlayersContainer.replaceChildren(playerNamesEl)
        errorMessagePlayerEl.textContent = ""
    }

    addListeners() {

        // adds listener to open the signup form
        document.getElementById("open-signup").addEventListener("click", () => {
            signupContainer.style.display = "block"
        })

        // adds listener to signup
        signupContainer.querySelector("button").addEventListener("click", () => {
            const username = document.getElementById("signup-username").value
            const password = document.getElementById("signup-password").value

            const url = BASE_URL + "/player/signup"
            const data = { username, password }

            this.handleLoginOrSignupRequest(url, data)
        })

        // adds listener to login
        loginContainer.querySelector("button").addEventListener("click", () => {
            const username = document.getElementById("login-username").value
            const password = document.getElementById("login-password").value

            const url = BASE_URL + "/player/login"
            const data = { username, password }

            this.handleLoginOrSignupRequest(url, data)
        })

        // adds listener to logout
        logoutButton.addEventListener("click", () => {
            this.logout()
        })

        // adds listener to open or close rules
        rulesButton.addEventListener("click", () => {
            rulesButton.textContent = rulesEl.style.display === "block" ? "Rules" : "Close Rules"
            rulesEl.style.display = rulesEl.style.display === "block" ? "none" : "block"
        })

        // adds listener to create new solo game
        document.getElementById("solo-game-button").addEventListener("click", () => {
            this.gameType = "solo"
            createGameContainer.style.display = "block"
            getPlayerContainer.style.display = "none"
            colorsContainer.style.display = "block"
            submitGameButton.textContent = "Start Solo Game"
            soloIntroEl.style.display = "block"
            webIntroEl.style.display = "none"
        })

        // adds listener to create new web game
        webGameButton.addEventListener("click", () => {
            this.gameType = "web"
            createGameContainer.style.display = "block"
            getPlayerContainer.style.display = "block"
            colorsContainer.style.display = "none"
            submitGameButton.textContent = "Send Invitation"
            webIntroEl.style.display = "block"
            soloIntroEl.style.display = "none"
        })

        // adds listener to display selected number of players
        numPlayersInput.addEventListener("input", () => {
            document.getElementById("num-players-display").textContent = numPlayersInput.value

            if (numPlayersInput.value === "2") {
                yellowCheckboxContainer.style.display = "none"
                greenCheckboxContainer.style.display = "none"
                orangeCheckboxContainer.style.display = "none"
                purpleCheckboxContainer.style.display = "none"

            } else if (numPlayersInput.value === "3") {
                yellowCheckboxContainer.style.display = "block"
                greenCheckboxContainer.style.display = "none"
                orangeCheckboxContainer.style.display = "none"
                purpleCheckboxContainer.style.display = "none"

            } else if (numPlayersInput.value === "4") {
                yellowCheckboxContainer.style.display = "block"
                greenCheckboxContainer.style.display = "block"
                orangeCheckboxContainer.style.display = "none"
                purpleCheckboxContainer.style.display = "none"

            } else if (numPlayersInput.value === "5") {
                yellowCheckboxContainer.style.display = "block"
                greenCheckboxContainer.style.display = "block"
                orangeCheckboxContainer.style.display = "block"
                purpleCheckboxContainer.style.display = "none"

            } else {
                yellowCheckboxContainer.style.display = "block"
                greenCheckboxContainer.style.display = "block"
                orangeCheckboxContainer.style.display = "block"
                purpleCheckboxContainer.style.display = "block"
            }
        })

        // adds listener to display selected size of board
        sizeInput.addEventListener("input", () => {
            document.getElementById("size-display").textContent = sizeInput.value
        })

        // adds listener to display selected density
        densityInput.addEventListener("input", () => {
            if (densityInput.value === "1") {
                document.getElementById("density-display").textContent = "Sparse"
            } else if (densityInput.value === "2") {
                document.getElementById("density-display").textContent = "Medium"
            } else {
                document.getElementById("density-display").textContent = "Dense"
            }
        })

        // adds listener to get input for names of players and load them from DB
        document.getElementById("add-player").addEventListener("click", () => {
            const playerToInviteInput = document.getElementById("player-input")
            const playerToInvite = playerToInviteInput.value
            playerToInviteInput.value = ""
            const headers = this.getHeaders(localStorage.getItem("authToken"))

            if (!playerToInvite) {
                return errorMessagePlayerEl.textContent = "Please provide the username of a player."
            }

            if (this.invitedPlayers.map(player => player.name).includes(playerToInvite)) {
                return errorMessagePlayerEl.textContent = `You have already invited ${playerToInvite}.`
            }

            if (this.connectedPlayers.map(player => player.name).includes(playerToInvite)) {
                const playerData = this.connectedPlayers.find(player => player.name === playerToInvite)
                this.invitedPlayers.push(playerData)
                this.displayInvitedPlayers()

            } else {
                axios.get(BASE_URL + "/player", { headers, params: { username: playerToInvite } })
                    .then(response => {
                        if (response.data.id) {
                            const playerData = {
                                id: response.data.id,
                                name: playerToInvite
                            }
                            this.invitedPlayers.push(playerData)
                            this.displayInvitedPlayers()
                        } else if (response.data?.errorMessage) {
                            errorMessagePlayerEl.textContent = response.data?.errorMessage
                        }
                    })
                    .catch(err => {
                        console.log("Error while loading player by username: ", err);
                        errorMessagePlayerEl.textContent = "The user could not be found."
                    })
            }
        })

        // resets list of invited players
        document.getElementById("reset-players").addEventListener("click", () => {
            this.invitedPlayers = []
            humanPlayersContainer.querySelector("p").remove()
        })

        // adds listener to create game
        submitGameButton.addEventListener("click", () => {
            const numPlayers = Number(numPlayersInput.value)
            const size = Number(sizeInput.value)
            let density
            if (densityInput.value === "1") {
                density = "sparse"
            } else if (densityInput.value === "2") {
                density = "medium"
            } else {
                density = "dense"
            }

            // checks if provided values are valid
            if (
                (size === 5 && numPlayers >= 5 && (density === "dense" || density === "medium")) ||
                (size === 4 && ((numPlayers >= 3 && (density === "dense" || density === "medium")) || numPlayers === 6))
            ) {
                const errorMessage = "The selected values are not valid. Try selecting less players, a greater size, or less density."
                return errorMessageCreateGameEl.textContent = errorMessage
            } else {
                errorMessageCreateGameEl.textContent = ""
            }

            // creates a new solo game
            if (this.gameType === "solo") {
                const humanPlayersNames = []
                const checkboxContainers = [
                    redCheckboxContainer,
                    blueCheckboxContainer,
                    yellowCheckboxContainer,
                    greenCheckboxContainer,
                    orangeCheckboxContainer,
                    purpleCheckboxContainer
                ]

                checkboxContainers.forEach(cont => {
                    const checkbox = cont.querySelector("input")
                    if (checkbox.checked) {
                        humanPlayersNames.push(checkbox.name)
                    }
                })

                const username = humanPlayersNames.length === 1 ? this.username : null
                const game = new Game(numPlayers, size, density, humanPlayersNames, username)

                game.createBoard()
                game.createDisplay()
                game.start()

            // creates a new web game
            } else {
                const playerData = {
                    id: this.id,
                    name: this.username
                }

                const humanPlayers = [...this.invitedPlayers, playerData]
                this.webGame = new WebGame(this.id, this.username, this.id, this.username, numPlayers, size, density, humanPlayers, this.socket)
                
                this.webGame.postGame()
            }
        })
    }

    addSocketListeners() {

        // socket listener for player who has just established a connection
        this.socket.on("request player id", () => {
            this.socket.emit("register", { playerId: this.id })
            console.log("message to register sent");

            if (this.webGame?.id) {
                this.socket.emit("join room", { webGameId: this.webGame.id })
                console.log("message to join room sent");

            }
        })

        // socket listener for invited players if player is invited to a new web game
        this.socket.on("invitation", msg => {
            const { webGameId, webGameData } = msg
            const { numPlayers, size, density, players, creator } = webGameData

            this.webGame = new WebGame(this.id, this.username, creator.id, creator.name, numPlayers, size, density, players, this.socket)
            this.webGame.id = webGameId
            this.webGame.display()

            this.socket.emit("join room", { webGameId })
            console.log("message to join room sent");
        })

        // socket listener for the creator if a player has declined the invitation
        this.socket.on("game declined", msg => {
            const { playerName } = msg

            const webGameSection = document.getElementById(this.webGame.id)
            webGameSection.querySelector("p").textContent = `${playerName} has declined to participate in the game.`

            if (this.webGame.creatorId === this.id) {
                webGameSection.querySelector(".revoke-invitation").remove()
            } else {
                webGameSection.querySelector(".accept-invitation").remove()
                webGameSection.querySelector(".decline-invitation").remove()
            }
        })

        // socket listener for invited players if the creator has revoked the invitation
        this.socket.on("invitation revoked", () => {
            const webGameSection = document.getElementById(this.webGame.id)
            webGameSection.querySelector("p").textContent = `${this.webGame.creatorName} has revoked the invitation for the game.`
            webGameSection.querySelector(".accept-invitation").remove()
            webGameSection.querySelector(".decline-invitation").remove()
        })

        // socket listener for the creator if all players are ready to start
        this.socket.on("ready", () => {
            const { numPlayers, size, density, humanPlayers, playerName, id, creatorId } = this.webGame
            if (this.id === creatorId) {
                const humanPlayersNames = humanPlayers.map(player => player.name)

                this.game = new Game(numPlayers, size, density, humanPlayersNames, playerName, id, this.socket)
                this.game.createBoard()
                this.game.createDisplay()

                const selectedPlayersColors = this.game.selectedPlayers.map(player => player.color)
                const fieldData = this.game.fields.map(field => ({
                    id: field.id,
                    color: field.player ? field.player.color : null,
                    value: field.value
                }))

                this.socket.emit("start", {
                    webGameId: id,
                    selectedPlayersColors,
                    fieldData
                })

                this.game.start()

                const storedToken = localStorage.getItem("authToken")
                const headers = this.getHeaders(storedToken)

                axios.put(BASE_URL + "/game/" + id, { status: "playing" }, { headers })
                    .catch(err => {
                        console.log("Error while updating game: ", err);
                    })
            }
        })

        // socket listener for invited players if the creator has sent the initial values of the board
        this.socket.on("set game", msg => {
            const { selectedPlayersColors, fieldData } = msg
            const { numPlayers, size, density, humanPlayers, playerName, id } = this.webGame
            const humanPlayersNames = humanPlayers.map(player => player.name)

            this.game = new Game(numPlayers, size, density, humanPlayersNames, playerName, id, this.socket)
            this.game.createBoard()

            const orderedSelectedPlayers = []
            for (const color of selectedPlayersColors) {
                const nextPlayer = this.game.selectedPlayers.find(player => player.color === color)
                orderedSelectedPlayers.push(nextPlayer)
            }
            this.game.selectedPlayers = orderedSelectedPlayers

            this.game.fields.forEach(field => {
                const fieldDatum = fieldData.find(el => el.id === field.id)
                field.player = this.game.selectedPlayers.find(player => player.color === fieldDatum.color)
                field.value = fieldDatum.value
                field.setField(field.player, field.value)
            })

            this.game.selectedPlayers.forEach(player => {
                player.fields = []
                this.game.fields.forEach(field => {
                    if (field.player && field.player.color === player.color) {
                        player.fields.push(field)
                    }
                })
            })

            this.game.remainingPlayers = this.game.selectedPlayers
            this.game.playerIsCreator = false
            this.game.createDisplay()
            this.game.start()
        })

        // socket listener for all players if a move has been done
        this.socket.on("move", msg => {
            const { move } = msg

            console.log("got move");
            console.log("submitted moveNum: ", move.moveNum);
            console.log("own moveNum: ", this.game.moveNum);
            
            move.moveNum === this.game.moveNum - 1
                ? this.game.setIsOn(move.fieldId)
                : this.socket.emit("request missing moves", {
                    webGameId: this.game.webGameId,
                    playerId: this.id,
                    lastMoveNum: this.game.moveNum
                })
        })

        // socket listener for player who has requested missing moves
        this.socket.on("send missing moves", msg => {
            let { missingMoves } = msg

            console.log("got missing moves: ", missingMoves);

            while (missingMoves.length > 0) {
                const smallestMoveNum = Math.min(...missingMoves.map(move => move.moveNum))
                const fieldId = missingMoves.find(move => move.moveNum === smallestMoveNum).fieldId
                this.game.setIsOn(fieldId)
                missingMoves = missingMoves.filter(move => move.moveNum === smallestMoveNum)
                console.log("missing moves after one loop iteration: ", missingMoves);
            }

        })
    }
}