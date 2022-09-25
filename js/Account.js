import {Game} from "./Game.js"
import {WebGame} from "./WebGame.js"
import {BASE_URL} from "./consts.js"

// elements in #account
const signupContainer = document.getElementById("signup")
const submitSignupButton = signupContainer.querySelector("button")
const openSignupButton = document.getElementById("open-signup")
const loginContainer = document.getElementById("login")
const submitLoginButton = loginContainer.querySelector("button")
const logoutContainer = document.getElementById("logout")
const logoutButton = logoutContainer.querySelector("button")
const menuButton = document.getElementById("menu-button")
const rulesButton = document.getElementById("rules-button")
const gameTypeButton = document.getElementById("game-type-button")
const playerNameHeading = document.getElementById("player-name")
const createGameContainer = document.getElementById("create-game")
const numPlayersInput = document.getElementById("num-players-input")
const sizeInput = document.getElementById("size-input")
const densityInput = document.getElementById("density-input")
const getPlayerContainer = document.getElementById("get-player")
const submitPlayerButton = getPlayerContainer.querySelector("button")
const errorMessagePlayerEl = document.getElementById("error-message-get-player")
const humanPlayersContainer = document.getElementById("human-players")
const yellowCheckboxContainer = document.getElementById("yellow")
const greenCheckboxContainer = document.getElementById("green")
const orangeCheckboxContainer = document.getElementById("orange")
const purpleCheckboxContainer = document.getElementById("purple")
const submitGameButton = document.getElementById("submit-game")
const errorMessageEl = document.getElementById("error-message")
const rulesEl = document.getElementById("rules")

export class Account {
    constructor(){
        this.id = null
        this.username = null
        this.email = null
        this.invitedPlayers = []
        this.createdGame = null
        this.invitedGames = null
        this.oldGames = null
        this.isLoggedIn = localStorage.getItem("authToken") ? true : false
        this.gameType = null
    }

    hideOrOpen(){
        if(this.isLoggedIn){
            loginContainer.style.display = "none"
            signupContainer.style.display = "none"
            logoutContainer.style.display = "block"
            playerNameHeading.style.display = "block"
            playerNameHeading.textContent = `Welcome, ${this.username}!`
            getPlayerContainer.style.display = "block"
            gameTypeButton.style.display = "unset"
            submitGameButton.textContent = "Send Invitation"
            this.gameType = "web"
        } else {
            loginContainer.style.display = "block"
            logoutContainer.style.display = "none"
            playerNameHeading.style.display = "none"
            getPlayerContainer.style.display = "none"
            gameTypeButton.style.display = "none"
            submitGameButton.textContent = "Start Solo Game"
            this.gameType = "solo"
        }
    }

    storeToken(token){
        localStorage.setItem("authToken", token)
    }

    getHeaders(storedToken){
        return {Authorization: `Bearer ${storedToken}`}
    }

    logout(){
        localStorage.removeItem("authToken")
        this.isLoggedIn = false
        console.log(this);
        this.hideOrOpen()
    }

    authenticateUser(){
        const storedToken = localStorage.getItem("authToken")
        if(storedToken){
            const headers = this.getHeaders(storedToken)
            axios.get(BASE_URL + "/player/verify", { headers })
                .then(response => {
                    const {id, username, email, createdGame, invitedGames, oldGames} = response.data
                    this.id = id
                    this.username = username
                    this.email = email
                    this.createdGame = createdGame
                    this.invitedGames = invitedGames
                    this.oldGames = oldGames
                    this.isLoggedIn = true
                    
                    // controls display
                    this.hideOrOpen()

                    console.log(this);
                })
                .catch(err => {
                    console.log("Error during authentication: ", err)
                    this.logout()
                })
        }
    }
    
    displayError(message){
        errorMessageEl.textContent = message
        errorMessageEl.style.display = "block"
    }

    addListeners(){

        // adds listener to open the signup form
        openSignupButton.addEventListener("click", () => {
            signupContainer.style.display = "block"
        })

        // adds listener to signup
        submitSignupButton.addEventListener("click", () => {
            const username = document.getElementById("signup-username").value
            const email = document.getElementById("signup-email").value
            const password = document.getElementById("signup-password").value
            
            const data = {username, email, password}
            
            axios.post(BASE_URL + "/player/signup", data)
            .then(response => {
                this.storeToken(response.data.authToken)
                this.authenticateUser()
            })
            .catch(err => console.log("Error during signup: ", err))
        })

        // adds listener to login
        submitLoginButton.addEventListener("click", () => {
            const username = document.getElementById("login-username").value
            const password = document.getElementById("login-password").value
            
            const data = {username, password}
            
            axios.post(BASE_URL + "/player/login", data)
            .then(response => {
                this.storeToken(response.data.authToken)
                this.authenticateUser()
            })
            .catch(err => console.log("error during login: ", err))
        })

        // adds listener to logout
        logoutButton.addEventListener("click", () => this.logout())

        // adds listener to open or close form to create a new game
        menuButton.addEventListener("click", () => {
            createGameContainer.style.display = createGameContainer.style.display === "block" ? "none" : "block"
        })

        // adds listener to open or close rules
        rulesButton.addEventListener("click", () => {
            rulesEl.style.display = rulesEl.style.display === "block" ? "none" : "block"
        })

        // adds listener to select game type
        gameTypeButton.addEventListener("click", () => {
            if (this.gameType === "solo") {
                this.gameType = "web"
                gameTypeButton.textContent = "Solo"
                getPlayerContainer.style.display = "block"
                submitGameButton.textContent = "Send Invitation"
            } else {        
                this.gameType = "solo"
                gameTypeButton.textContent = "Web"
                getPlayerContainer.style.display = "none"
                submitGameButton.textContent = "Start Solo Game"
            }
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

            axios.get(BASE_URL + "/player", { headers, params: { username: playerToInvite }})
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
                    errorMessagePlayerEl.textContent = "The user could not be found."
                    console.log("Error while loading player by username: ", err);
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

            const invitedPlayers = this.invitedPlayers.map(player => player[0])

            // check if provided values are valid
            let message
            if (numPlayers <= 1){
                message = "You need to select at least two players."
                return this.displayError(message)
            } else if ((size === 5 && numPlayers >= 5 && (density === "dense" || density === "medium"))
                || (size === 4 && ((numPlayers >= 3 && (density === "dense" || density === "medium")) || numPlayers === 6))) {
                message = "The selected values are not valid. Try selecting less players, a smaller field, or less density."
                return this.displayError(message)
            } else {
                errorMessageEl.style.display = "none"          
            }

            if (this.gameType === "solo") {
                const game = new Game()
                game.createBoard()
                game.startGame()
            } else {
                this.createdGame = new WebGame(this.id, numPlayers, size, density, invitedPlayers)
                // functionality to invite players (websockets, nodemailer)
            }
        })


    }

}