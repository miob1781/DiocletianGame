import axios from "axios"
import { io, Socket } from "socket.io-client"
import { Game } from "./Game"
import { WebGame } from "./WebGame"
import { BASE_URL } from "./consts"
import { playMoves } from "./helper_functions"
import { AccountT, AuthData, Color, Density, FieldData, GameCreated, GameT, GameType, HeadersT, Move, PlayerData, PlayerT, WebGameData, WebGameT } from "./types"

// elements in #account
const signupContainer = document.getElementById("signup")!
const loginContainer = document.getElementById("login")!
const logoutButton = document.getElementById("logout")!
const errorMessageAccountEl = document.getElementById("error-message-account")!
const webGameButton = document.getElementById("web-game-button")!
const rulesButton = document.getElementById("rules-button")!
const playerNameHeading = document.getElementById("player-name")!
const createGameContainer = document.getElementById("create-game")!
const soloIntroEl = document.getElementById("intro-solo")!
const webIntroEl = document.getElementById("intro-web")!
const numPlayersInput = document.getElementById("num-players-input") as HTMLInputElement
const sizeInput = document.getElementById("size-input") as HTMLInputElement
const densityInput = document.getElementById("density-input") as HTMLInputElement
const getPlayerContainer = document.getElementById("get-player")!
const errorMessagePlayerEl = document.getElementById("error-message-get-player")!
const humanPlayersContainer = document.getElementById("human-players")!
const colorsContainer = document.getElementById("colors")!
const redCheckboxContainer = document.getElementById("red")!
const blueCheckboxContainer = document.getElementById("blue")!
const yellowCheckboxContainer = document.getElementById("yellow")!
const greenCheckboxContainer = document.getElementById("green")!
const orangeCheckboxContainer = document.getElementById("orange")!
const purpleCheckboxContainer = document.getElementById("purple")!
const submitGameButton = document.getElementById("submit-game")!
const errorMessageCreateGameEl = document.getElementById("error-message-create-game")!
const rulesEl = document.getElementById("rules")!

export class Account implements AccountT {
    id: string | null
    username: string | null
    invitedPlayers: PlayerData[]
    connectedPlayers: PlayerData[] | null
    gameType: GameType | null
    socket: Socket | null
    webGame: WebGameT | null
    game: GameT | null
    isLoggedIn: boolean

    constructor() {
        this.id = null
        this.username = null
        this.invitedPlayers = []
        this.connectedPlayers = null
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
            this.gameType = GameType.Web

        } else {
            loginContainer.style.display = "block"
            logoutButton.style.display = "none"
            webGameButton.style.display = "none"
            playerNameHeading.style.display = "none"
            getPlayerContainer.style.display = "none"
            colorsContainer.style.display = "block"
            submitGameButton.textContent = "Start Solo Game"
            this.gameType = GameType.Solo
        }
    }

    // loads the values of old games to get the connected players, the games open for partipation and the number of games played and won
    loadGames() {
        const storedToken: string = localStorage.getItem("authToken")!
        const headers: HeadersT = { Authorization: `Bearer ${storedToken}` }

        axios.get(BASE_URL + "/game/", { headers, params: { playerId: this.id } })
            .then((response: {
                data: {
                    connectedPlayers: PlayerData[],
                    gamesCreated: GameCreated[],
                    numGamesFinished: number,
                    numGamesWon: number
                }
            }) => {
                const data = response.data
                const { connectedPlayers, gamesCreated, numGamesFinished, numGamesWon } = data

                webIntroEl.textContent = `You have played ${numGamesFinished} game${numGamesFinished === 1 ? "" : "s"} on the web and have won ${numGamesWon} of them. Try another one?`

                gamesCreated.forEach(gameLoaded => {
                    const { id, numPlayers, size, density, players, creator } = gameLoaded

                    this.webGame = new WebGame(this.id!, this.username!, creator.id, creator.name, numPlayers, size, density, players, this.socket!)
                    this.webGame.id = id
                    this.webGame.display()

                    this.socket!.emit("join room", { webGameId: id })
                })

                connectedPlayers.forEach(player => {
                    const optionEl = document.createElement("option")
                    optionEl.value = player.name
                    document.getElementById("players-list")!.appendChild(optionEl)
                })

                this.connectedPlayers = connectedPlayers
            })
            .catch((err: unknown) => {
                console.log("Error while loading games: ", err);
            })
    }

    // starts a new game with default values after authentication
    startGame() {
        const game = new Game(4, 6, Density.Sparse, ["red"], this.username)
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
        const storedToken: string | null = localStorage.getItem("authToken")
        if (storedToken) {
            const headers: HeadersT = { Authorization: `Bearer ${storedToken}` }

            axios.get(BASE_URL + "/player/verify", { headers })
                .then((response: {
                    data: {
                        id: string,
                        username: string
                    }
                }) => {
                    const data = response.data
                    const { id, username } = data

                    this.id = id
                    this.username = username
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
                .catch((err: unknown) => {
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
    handleLoginOrSignupRequest(url: string, data: AuthData) {
        axios.post(url, data)
            .then((response: { data: { authToken: string } }) => {
                localStorage.setItem("authToken", response.data.authToken)
                this.authenticateUser()
                errorMessageAccountEl.textContent = ""
            })
            .catch((err: { response: { data: { errorMessage: string } } }) => {
                console.log("Error: ", err)
                const message: string = err.response?.data?.errorMessage ? err.response?.data?.errorMessage : "Something has gone wrong."
                errorMessageAccountEl.textContent = message
            })
    }

    // displays invited players for a web game
    displayInvitedPlayers() {
        const playersString: string = this.invitedPlayers.reduce((currString: string, player: PlayerData): string => {
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
        document.getElementById("open-signup")!.addEventListener("click", () => {
            signupContainer.style.display = "block"
        })

        // adds listener to signup
        signupContainer.querySelector("button")!.addEventListener("click", () => {
            const usernameInputEl = document.getElementById("signup-username") as HTMLInputElement
            const passwordInputEl = document.getElementById("signup-password") as HTMLInputElement

            const username: string = usernameInputEl.value
            const password: string = passwordInputEl.value

            const url: string = BASE_URL + "/player/signup"
            const data: AuthData = { username, password }

            this.handleLoginOrSignupRequest(url, data)
        })

        // adds listener to login
        loginContainer.querySelector("button")!.addEventListener("click", () => {
            const usernameInputEl = document.getElementById("login-username") as HTMLInputElement
            const passwordInputEl = document.getElementById("login-password") as HTMLInputElement

            const username: string = usernameInputEl.value
            const password: string = passwordInputEl.value

            const url: string = BASE_URL + "/player/login"
            const data: AuthData = { username, password }

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
        document.getElementById("solo-game-button")!.addEventListener("click", () => {
            this.gameType = GameType.Solo
            createGameContainer.style.display = "block"
            getPlayerContainer.style.display = "none"
            colorsContainer.style.display = "block"
            submitGameButton.textContent = "Start Solo Game"
            soloIntroEl.style.display = "block"
            webIntroEl.style.display = "none"
        })

        // adds listener to create new web game
        webGameButton.addEventListener("click", () => {
            this.gameType = GameType.Web
            createGameContainer.style.display = "block"
            getPlayerContainer.style.display = "block"
            colorsContainer.style.display = "none"
            submitGameButton.textContent = "Send Invitation"
            webIntroEl.style.display = "block"
            soloIntroEl.style.display = "none"
        })

        // adds listener to display selected number of players
        numPlayersInput.addEventListener("input", () => {
            document.getElementById("num-players-display")!.textContent = numPlayersInput.value

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
            document.getElementById("size-display")!.textContent = sizeInput.value
        })

        // adds listener to display selected density
        densityInput.addEventListener("input", () => {
            if (densityInput.value === "1") {
                document.getElementById("density-display")!.textContent = Density.Sparse
            } else if (densityInput.value === "2") {
                document.getElementById("density-display")!.textContent = Density.Medium
            } else {
                document.getElementById("density-display")!.textContent = Density.Dense
            }
        })

        // adds listener to get input for names of players and load them from DB
        document.getElementById("add-player")!.addEventListener("click", () => {
            const playerToInviteInput = document.getElementById("player-input") as HTMLInputElement
            const playerToInvite = playerToInviteInput.value
            playerToInviteInput.value = ""

            if (!playerToInvite) {
                return errorMessagePlayerEl.textContent = "Please provide the username of a player."
            }

            if (this.invitedPlayers.map(player => player.name).includes(playerToInvite)) {
                return errorMessagePlayerEl.textContent = `You have already invited ${playerToInvite}.`
            }

            if (this.connectedPlayers!.map(player => player.name).includes(playerToInvite)) {
                const playerData: PlayerData = this.connectedPlayers!.find(player => player.name === playerToInvite)!
                this.invitedPlayers.push(playerData)
                this.displayInvitedPlayers()

            } else {
                const storedToken: string = localStorage.getItem("authToken")!
                const headers: HeadersT = { Authorization: `Bearer ${storedToken}` }

                axios.get(BASE_URL + "/player", { headers, params: { username: playerToInvite } })
                    .then((response: { data: { id: string, errorMessage: string } }) => {
                        const id: string | undefined = response.data.id

                        if (id) {
                            const playerData: PlayerData = {
                                id: response.data.id,
                                name: playerToInvite
                            }

                            this.invitedPlayers.push(playerData)
                            this.displayInvitedPlayers()

                        } else if (response.data?.errorMessage) {
                            errorMessagePlayerEl.textContent = response.data?.errorMessage
                        }
                    })
                    .catch((err: unknown) => {
                        console.log("Error while loading player by username: ", err);
                        errorMessagePlayerEl.textContent = "The user could not be found."
                    })
            }
        })

        // resets list of invited players
        document.getElementById("reset-players")!.addEventListener("click", () => {
            this.invitedPlayers = []
            humanPlayersContainer.querySelector("p")!.remove()
        })

        // adds listener to create game
        submitGameButton.addEventListener("click", () => {
            const numPlayers: number = Number(numPlayersInput.value)
            const size: number = Number(sizeInput.value)
            let density: Density
            if (densityInput.value === "1") {
                density = Density.Sparse
            } else if (densityInput.value === "2") {
                density = Density.Medium
            } else {
                density = Density.Dense
            }

            // checks if provided values are valid
            if (
                (size === 5 && numPlayers >= 5 && (density === Density.Dense || density === Density.Medium)) ||
                (size === 4 && ((numPlayers >= 3 && (density === Density.Dense || density === Density.Medium)) || numPlayers === 6))
            ) {
                const errorMessage: string = "The selected values are not valid. Try selecting less players, a greater size, or less density."
                return errorMessageCreateGameEl.textContent = errorMessage
            } else {
                errorMessageCreateGameEl.textContent = ""
            }

            // creates a new solo game
            if (this.gameType === GameType.Solo) {
                const humanPlayersNames: string[] = []
                const checkboxContainers = [
                    redCheckboxContainer,
                    blueCheckboxContainer,
                    yellowCheckboxContainer,
                    greenCheckboxContainer,
                    orangeCheckboxContainer,
                    purpleCheckboxContainer
                ]

                checkboxContainers.forEach(cont => {
                    const checkbox = cont.querySelector("input")!
                    if (checkbox.checked) {
                        humanPlayersNames.push(checkbox.name)
                    }
                })

                const username: string | null = humanPlayersNames.length === 1 ? this.username : null
                const game = new Game(numPlayers, size, density, humanPlayersNames, username)

                game.createBoard()
                game.createDisplay()
                game.start()

                // creates a new web game
            } else {
                const playerData: PlayerData = {
                    id: this.id!,
                    name: this.username!
                }

                const humanPlayers: PlayerData[] = [...this.invitedPlayers, playerData]
                this.webGame = new WebGame(this.id!, this.username!, this.id!, this.username!, numPlayers, size, density, humanPlayers, this.socket!)

                this.webGame.postGame()
            }
        })
    }

    addSocketListeners() {

        // socket listener for player who has just established a connection
        this.socket!.on("request player id", () => {
            this.socket!.emit("register", { playerId: this.id })

            if (this.webGame) {
                this.socket!.emit("join room", { webGameId: this.webGame.id })
                this.socket!.emit("request missing move", {
                    webGameId: this.webGame.id,
                    moveNum: this.game!.moveNum + 1
                })
            }
        })

        // socket listener for invited players when player is invited to a new web game
        this.socket!.on("invitation", (msg: { webGameId: string, webGameData: WebGameData }) => {
            const { webGameId, webGameData } = msg
            const { numPlayers, size, density, players, creator } = webGameData

            this.webGame = new WebGame(this.id!, this.username!, creator.id, creator.name, numPlayers, size, density, players, this.socket!)
            this.webGame.id = webGameId
            this.webGame.display()

            this.socket!.emit("join room", { webGameId })
        })

        // socket listener for the creator when a player has declined the invitation
        this.socket!.on("game declined", (msg: { playerName: string }) => {
            const { playerName } = msg

            const webGameSection = document.getElementById(this.webGame!.id!)!
            webGameSection.querySelector("p")!.textContent = `${playerName} has declined to participate in the game.`

            if (this.webGame!.creatorId === this.id) {
                webGameSection.querySelector(".revoke-invitation")!.remove()
            } else {
                webGameSection.querySelector(".accept-invitation")!.remove()
                webGameSection.querySelector(".decline-invitation")!.remove()
            }
        })

        // socket listener for invited players when the creator has revoked the invitation
        this.socket!.on("invitation revoked", () => {
            const webGameSection = document.getElementById(this.webGame!.id!)!
            webGameSection.querySelector("p")!.textContent = `${this.webGame!.creatorName} has revoked the invitation for the game.`
            webGameSection.querySelector(".accept-invitation")!.remove()
            webGameSection.querySelector(".decline-invitation")!.remove()
        })

        // socket listener for the creator when all players are ready to start
        this.socket!.on("ready", () => {
            const { numPlayers, size, density, humanPlayers, playerName, id, creatorId } = this.webGame!
            if (this.id === creatorId) {
                const humanPlayersNames: string[] = humanPlayers.map(player => player.name)

                this.game = new Game(numPlayers, size, density, humanPlayersNames, playerName, id, this.socket)
                this.game.createBoard()
                this.game.createDisplay()

                const selectedPlayersColors: Color[] = this.game.selectedPlayers.map(player => player.color)
                const fieldData: FieldData[] = this.game.fields.map(field => ({
                    id: field.id,
                    color: field.player ? field.player.color : null,
                    value: field.value
                }))

                this.socket!.emit("start", {
                    webGameId: id,
                    selectedPlayersColors,
                    fieldData
                })

                this.game.start()

                const storedToken: string = localStorage.getItem("authToken")!
                const headers: HeadersT = { Authorization: `Bearer ${storedToken}` }

                axios.put(BASE_URL + "/game/" + id, { status: "playing" }, { headers })
                    .catch((err: unknown) => {
                        console.log("Error while updating game: ", err);
                    })
            }
        })

        // socket listener for invited players when the creator has sent the initial values of the board
        this.socket!.on("set game", (msg: { selectedPlayersColors: Color[], fieldData: FieldData[] }) => {
            const { selectedPlayersColors, fieldData } = msg
            const { numPlayers, size, density, humanPlayers, playerName, id } = this.webGame!
            const humanPlayersNames: string[] = humanPlayers.map(player => player.name)

            this.game = new Game(numPlayers, size, density, humanPlayersNames, playerName, id, this.socket)
            this.game.createBoard()

            const orderedSelectedPlayers: PlayerT[] = []
            for (const color of selectedPlayersColors) {
                const nextPlayer: PlayerT = this.game.selectedPlayers.find(player => player.color === color)!
                orderedSelectedPlayers.push(nextPlayer)
            }
            this.game.selectedPlayers = orderedSelectedPlayers

            this.game.fields.forEach(field => {
                const fieldDatum: FieldData = fieldData.find(el => el.id === field.id)!
                field.player = this.game!.selectedPlayers.find(player => player.color === fieldDatum!.color)!
                field.value = fieldDatum.value
                field.setField(field.player, field.value)
            })

            this.game.selectedPlayers.forEach(player => {
                player.fields = []
                this.game!.fields.forEach(field => {
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

        // socket listener when a move has been sent
        this.socket!.on("move", (msg: { move: Move }) => {
            const { move } = msg

            // adds incoming move to array of moves
            this.game!.moves.push(move)

            // plays stored moves in correct order
            playMoves(this, this.game!.moveNum)
        })
    }
}
