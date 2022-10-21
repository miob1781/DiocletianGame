import { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js";
import { Game } from "./Game.js"
import { WebGame } from "./WebGame.js"
import { BASE_URL } from "./consts.js"

// elements in #account
const signupContainer = document.getElementById("signup")
const submitSignupButton = signupContainer.querySelector("button")
const openSignupButton = document.getElementById("open-signup")
const loginContainer = document.getElementById("login")
const submitLoginButton = loginContainer.querySelector("button")
const logoutButton = document.getElementById("logout")
const errorMessageAccountEl = document.getElementById("error-message-account")
const soloGameButton = document.getElementById("solo-game-button")
const webGameButton = document.getElementById("web-game-button")
const rulesButton = document.getElementById("rules-button")
const playerNameHeading = document.getElementById("player-name")
const createGameContainer = document.getElementById("create-game")
const numPlayersInput = document.getElementById("num-players-input")
const sizeInput = document.getElementById("size-input")
const densityInput = document.getElementById("density-input")
const getPlayerContainer = document.getElementById("get-player")
const submitPlayerButton = getPlayerContainer.querySelector("button")
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
        this.createdGame = null
        this.invitedGames = null
        this.oldGames = null
        this.gameType = null
        this.socket = null
        this.webGame = null
        this.game = null
        this.isLoggedIn = localStorage.getItem("authToken") ? true : false
    }

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

    getHeaders(storedToken) {
        return { Authorization: `Bearer ${storedToken}` }
    }

    loadGames() {
        const storedToken = localStorage.getItem("authToken")
        const headers = this.getHeaders(storedToken)
        axios.get(BASE_URL + "/game/", { headers, params: { playerId: this.id } })
            .then(response => {
                console.log(response.data);
                const { connectedPlayers, gamesCreated, numGamesFinished, numGamesWon } = response.data

                gamesCreated.forEach(gameLoaded => {
                    const { id, numPlayers, size, density, players, creator } = gameLoaded

                    this.webGame = new WebGame(this.id, this.username, creator.id, creator.name, numPlayers, size, density, players, this.socket)
                    this.webGame.id = id
                    this.webGame.display()

                    this.socket.emit("join room", { webGameId: id })
                })
            })
            .catch(err => {
                console.log("error while loading games: ", err);
            })
    }

    startGame() {
        // starting a new game
        const game = new Game(4, 6, "sparse", ["red"], this.username)
        game.createBoard()
        game.createDisplay()
        game.start()
    }

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

        // starts a new game after logout
        this.startGame()
    }

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

    addListeners() {

        // adds listener to open the signup form
        openSignupButton.addEventListener("click", () => {
            signupContainer.style.display = "block"
        })

        // adds listener to signup
        submitSignupButton.addEventListener("click", () => {
            const username = document.getElementById("signup-username").value
            const password = document.getElementById("signup-password").value

            const url = BASE_URL + "/player/signup"
            const data = { username, password }

            this.handleLoginOrSignupRequest(url, data)
        })

        // adds listener to login
        submitLoginButton.addEventListener("click", () => {
            const username = document.getElementById("login-username").value
            const password = document.getElementById("login-password").value

            const url = BASE_URL + "/player/login"
            const data = { username, password }

            this.handleLoginOrSignupRequest(url, data)
        })

        // adds listener to logout
        logoutButton.addEventListener("click", () => this.logout())

        // adds listener to open or close rules
        rulesButton.addEventListener("click", () => {
            rulesButton.textContent = rulesEl.style.display === "block" ? "Rules" : "Close Rules"
            rulesEl.style.display = rulesEl.style.display === "block" ? "none" : "block"
        })

        // adds listener to create new solo game
        soloGameButton.addEventListener("click", () => {
            this.gameType = "solo"
            createGameContainer.style.display = "block"
            getPlayerContainer.style.display = "none"
            colorsContainer.style.display = "block"
            submitGameButton.textContent = "Start Solo Game"
        })

        // adds listener to create new web game
        webGameButton.addEventListener("click", () => {
            this.gameType = "web"
            createGameContainer.style.display = "block"
            getPlayerContainer.style.display = "block"
            colorsContainer.style.display = "none"
            submitGameButton.textContent = "Send Invitation"
        })

        // adds listeners to display selected values of range inputs
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

        sizeInput.addEventListener("input", () => {
            document.getElementById("size-display").textContent = sizeInput.value
        })

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
        submitPlayerButton.addEventListener("click", () => {
            const playerToInvite = document.getElementById("player-input").value
            const headers = this.getHeaders(localStorage.getItem("authToken"))

            if (!playerToInvite) {
                return errorMessagePlayerEl.textContent = "Please provide the username of a player."
            }

            axios.get(BASE_URL + "/player", { headers, params: { username: playerToInvite } })
                .then(response => {
                    if (response.data.id) {
                        const playerData = {
                            id: response.data.id,
                            name: playerToInvite
                        }

                        this.invitedPlayers.push(playerData)

                        const invitedPlayersHeading = document.createElement("h3")
                        invitedPlayersHeading.textContent = "Invited Players"
                        humanPlayersContainer.appendChild(invitedPlayersHeading)

                        this.invitedPlayers.forEach(player => {
                            const playerToInviteContainer = document.createElement("div")
                            playerToInviteContainer.className = "player-to-invite"
                            const playerNameEl = document.createElement("p")
                            playerNameEl.textContent = player.name
                            playerToInviteContainer.appendChild(playerNameEl)
                            humanPlayersContainer.appendChild(playerToInviteContainer)
                        })

                        errorMessagePlayerEl.textContent = ""
                    } else if (response.data?.errorMessage) {
                        errorMessagePlayerEl.textContent = response.data?.errorMessage
                    }
                })
                .catch(err => {
                    console.log("Error while loading player by username: ", err);
                    errorMessagePlayerEl.textContent = "The user could not be found."
                })
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

            // check if provided values are valid
            if ((size === 5 && numPlayers >= 5 && (density === "dense" || density === "medium"))
                || (size === 4 && ((numPlayers >= 3 && (density === "dense" || density === "medium")) || numPlayers === 6))) {
                const errorMessage = "The selected values are not valid. Try selecting less players, a greater size, or less density."
                return errorMessageCreateGameEl.textContent = errorMessage
            } else {
                errorMessageCreateGameEl.textContent = ""
            }

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
        this.socket.on("invitation", msg => {
            const { webGameId, invitedPlayersIds, webGameData } = msg

            if (invitedPlayersIds.includes(this.id)) {
                const { numPlayers, size, density, players, creator } = webGameData

                this.webGame = new WebGame(this.id, this.username, creator.id, creator.name, numPlayers, size, density, players, this.socket)
                this.webGame.id = webGameId
                this.webGame.status = "created"

                this.webGame.display(creator.name)

                this.socket.emit("join room", { webGameId })
            }
        })

        this.socket.on("game declined", msg => {
            const { playerName } = msg
            const webGameSection = document.getElementById(this.webGame.id)
            webGameSection.querySelector("p").textContent = `${playerName} has declined to participate in the game.`
            webGameSection.querySelector("button").remove()
        })

        this.socket.on("invitation revoked", msg => {
            const { webGameId } = msg

            if (this.webGame?.id === webGameId) {
                const webGameSection = document.getElementById(this.webGame.id)
                webGameSection.querySelector("p").textContent = `${this.webGame.creatorName} has revoked the invitation for the game.`
                webGameSection.querySelector(".accept-invitation").remove()
                webGameSection.querySelector(".decline-invitation").remove()
            }
        })

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

        this.socket.on("move", msg => {
            const { move } = msg
            this.game.setIsOn(move)
        })
    }
}