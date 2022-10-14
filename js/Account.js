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
        this.email = null
        this.invitedPlayers = []
        this.createdGame = null
        this.invitedGames = null
        this.oldGames = null
        this.isLoggedIn = localStorage.getItem("authToken") ? true : false
        this.gameType = null
        this.socket = null
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

    logout() {
        localStorage.removeItem("authToken")
        this.id = null
        this.username = null
        this.email = null
        this.invitedPlayers = []
        this.createdGame = null
        this.invitedGames = null
        this.oldGames = null
        this.gameType = null
        this.isLoggedIn = false

        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
        }

        this.hideOrOpen()

        // starting a new game after logout
        const game = new Game(4, 6, "sparse", ["red"])
        game.createBoard()
        game.startGame()

    }

    authenticateUser() {
        const storedToken = localStorage.getItem("authToken")
        if (storedToken) {
            const headers = this.getHeaders(storedToken)
            axios.get(BASE_URL + "/player/verify", { headers })
                .then(response => {
                    const { id, username, email, createdGame, invitedGames, oldGames } = response.data

                    this.id = id
                    this.username = username
                    this.email = email
                    this.createdGame = createdGame
                    this.invitedGames = invitedGames
                    this.oldGames = oldGames
                    this.isLoggedIn = true

                    // controls display
                    this.hideOrOpen()

                    // starting a new game after authentication
                    const game = new Game(4, 6, "sparse", ["red"], this.username)
                    game.createBoard()
                    game.startGame()

                    // starts websocket
                    this.socket = io(BASE_URL, { withCredentials: true })
                    this.addSocketListeners()

                    console.log(this);
                })
                .catch(err => {
                    console.log("Error during authentication: ", err)
                    this.logout()
                })
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
                const message = err.response.data.errorMessage ? err.response.data.errorMessage : "Something has gone wrong."
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
            const email = document.getElementById("signup-email").value
            const password = document.getElementById("signup-password").value

            const url = BASE_URL + "/player/signup"
            const data = { username, email, password }

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
                        this.invitedPlayers.push([response.data.id, playerToInvite])
                        const invitedPlayersHeading = document.createElement("h3")
                        invitedPlayersHeading.textContent = "Invited Players"
                        humanPlayersContainer.appendChild(invitedPlayersHeading)

                        this.invitedPlayers.forEach(player => {
                            const playerToInviteContainer = document.createElement("div")
                            playerToInviteContainer.className = "player-to-invite"
                            const playerNameEl = document.createElement("p")
                            playerNameEl.textContent = player[1]
                            playerToInviteContainer.appendChild(playerNameEl)
                            humanPlayersContainer.appendChild(playerToInviteContainer)
                        })

                        errorMessagePlayerEl.textContent = ""
                    } else if (response.data.errorMessage) {
                        errorMessagePlayerEl.textContent = response.data.errorMessage
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
                const humanPlayers = []
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
                        humanPlayers.push(checkbox.name)
                    }
                })
                const username = humanPlayers.length === 1 ? this.username : null

                const game = new Game(numPlayers, size, density, humanPlayers, username)

                game.createBoard()
                game.startGame()
            } else {
                const webGame = new WebGame(this.id, this.username, this.id, this.username, numPlayers, size, density, this.invitedPlayers, this.socket)
                webGame.postGame()
            }
        })
    }

    addSocketListeners() {
        this.socket.on("invitation", msg => {
            const { webGameId, invitedPlayers } = msg
            const storedToken = localStorage.getItem("authToken")
            const invitedPlayersIds = invitedPlayers.map(player => player[0])

            if (storedToken && invitedPlayersIds.includes(this.id)) {
                const headers = this.getHeaders(storedToken)

                axios.get(BASE_URL + "/game/" + webGameId, { headers })
                    .then(response => {
                        const { numPlayers, size, density, players, creator } = response.data.game
                        const otherPlayers = players.map(player => player._id).filter(id => id !== this.id)
                        const webGame = new WebGame(this.id, this.username, creator.id, creator.username, numPlayers, size, density, otherPlayers, this.socket)

                        webGame.display(creator.username)

                        this.socket.on("start game", () => {
                            const game = new Game()
                        })
                    })
            }
        })
    }
}