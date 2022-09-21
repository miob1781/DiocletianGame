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

export class Account {
    constructor(){
        this.id = null
        this.username = null
        this.email = null
        this.createdGame = null
        this.invitedGames = null
        this.oldGames = null
        this.isLoggedIn = localStorage.getItem("authToken") ? true : false
    }

    storeToken(token){
        localStorage.setItem("authToken", token)
    }

    getHeaders(storedToken){
        return {headers: {Authorization: `Bearer ${storedToken}`}}
    }

    authenticateUser(){
        const storedToken = localStorage.getItem("authToken")
        if(storedToken){
            const headers = this.getHeaders(storedToken)
            axios.get(BASE_URL + "/player/verify", headers)
            .then(response => {
                    const {id, username, email, createdGame, invitedGames, oldGames} = response.data
                    this.id = id
                    this.username = username
                    this.email = email
                    this.createdGame = createdGame
                    this.invitedGames = invitedGames
                    this.oldGames = oldGames
                    this.isLoggedIn = true
                    
                    loginContainer.style.display = "none"
                    signupContainer.style.display = "none"
                    logoutContainer.style.display = "block"
                    playerNameEl.style.display = this.isLoggedIn ? "block" : "none"
                    playerNameEl.textContent = `Welcome, ${this.username}!`
            
                    console.log(this);
                })
                .catch(err => console.log("error during authentication: ", err))
            }
        }
    
    addListeners(){
        // make display of login, logout and name dependent on whether player is logged in
        loginContainer.style.display = this.isLoggedIn ? "none" : "block"
        logoutContainer.style.display = this.isLoggedIn ? "block" : "none"
        playerNameEl.style.display = this.isLoggedIn ? "block" : "none"
        playerNameEl.textContent = `Welcome, ${this.username}!`

        // add listener to open the signup form
        openSignupEl.addEventListener("click", () => {
            signupContainer.style.display = "block"
        })

        // add listener to signup
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

        // add listener to login
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

        // add listener to logout
        logoutEl.addEventListener("click", () => {
            localStorage.removeItem("authToken")
            this.isLoggedIn = false

            logoutContainer.style.display = "none"
            loginContainer.style.display = "block"
            loginContainer.style.display = "block"
            playerNameEl.style.display = "none"
        })
    }

}