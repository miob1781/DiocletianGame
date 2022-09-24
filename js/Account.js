import {WebGame} from "./WebGame.js"
import {BASE_URL} from "./consts.js"

// elements in #account
const signupContainer = document.getElementById("signup")
const submitSignupEl = signupContainer.querySelector("button")
const openSignupEl = document.getElementById("open-signup")
const loginContainer = document.getElementById("login")
const submitLoginEl = loginContainer.querySelector("button")
const logoutContainer = document.getElementById("logout")
const logoutEl = logoutContainer.querySelector("button")
const playerNameEl = document.getElementById("player-name")
const createGameContainer = document.getElementById("create-game")
const submitPlayerEl = document.querySelector("#get-player button")
const errorMessagePlayerEl = document.getElementById("error-message-get-player")
const invitedPlayersContainer = document.getElementById("invited-players")
const submitGameEl = createGameContainer.querySelector("button")

export class Account {
    constructor(){
        this.id = null
        this.username = null
        this.email = null
        this.playersToInvite = []
        this.createdGame = null
        this.invitedGames = null
        this.oldGames = null
        this.isLoggedIn = localStorage.getItem("authToken") ? true : false
    }

    hideOrOpen(){
        if(this.isLoggedIn){
            loginContainer.style.display = "none"
            signupContainer.style.display = "none"
            logoutContainer.style.display = "block"
            playerNameEl.style.display = "block"
            playerNameEl.textContent = `Welcome, ${this.username}!`
            createGameContainer.style.display = "block"
        } else {
            loginContainer.style.display = "block"
            logoutContainer.style.display = "none"
            playerNameEl.style.display = "none"
            createGameContainer.style.display = "none"
        }
    }

    storeToken(token){
        localStorage.setItem("authToken", token)
    }

    getHeaders(storedToken){
        return {Authorization: `Bearer ${storedToken}`}
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
                .catch(err => console.log("Error during authentication: ", err))
            }
        }
    
    addListeners(){

        // adds listener to open the signup form
        openSignupEl.addEventListener("click", () => {
            signupContainer.style.display = "block"
        })

        // adds listener to signup
        submitSignupEl.addEventListener("click", () => {
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
        submitLoginEl.addEventListener("click", () => {
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
        logoutEl.addEventListener("click", () => {
            localStorage.removeItem("authToken")
            this.isLoggedIn = false
            this.hideOrOpen()
        })

        // get input for names of players and loads them from DB
        submitPlayerEl.addEventListener("click", () => {
            const playerToInvite = document.getElementById("player-input").value
            const headers = this.getHeaders(localStorage.getItem("authToken"))

            if (!playerToInvite) {
                return errorMessagePlayerEl.textContent = "Please provide the username of a player."
            }

            axios.get(BASE_URL + "/player", { headers, params: { username: playerToInvite }})
                .then(response => {
                    if (response.data.id) {
                        this.playersToInvite.push([response.data.id, playerToInvite])
                        const invitedPlayersHeading = document.createElement("h3")
                        invitedPlayersHeading.textContent = "Invited Players"
                        invitedPlayersContainer.appendChild(invitedPlayersHeading)
                        this.playersToInvite.forEach(player => {
                            const playerToInviteContainer = document.createElement("div")
                            playerToInviteContainer.className = "player-to-invite"
                            const playerNameEl = document.createElement("p")
                            playerNameEl.textContent = player[1]
                            playerToInviteContainer.appendChild(playerNameEl)
                            invitedPlayersContainer.appendChild(playerToInviteContainer)
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
        submitGameEl.addEventListener("click", () => {
            const numPlayers = document.getElementById("num-players-input-web")
            const size = document.getElementById("size-input-web")
            const density = document.getElementById("density-input-web")
            const invitedPlayers = this.invitedPlayers.map(player => player[0])

            this.createdGame = new WebGame(this.id, numPlayers, size, density, invitedPlayers)
            // functionality to invite players (websockets, nodemailer)
        })
    }

}