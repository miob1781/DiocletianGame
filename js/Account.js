import {WebGame} from "./WebGame.js"
import {BASE_URL} from "./consts.js"

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
                    
                    console.log(this);
                })
                .catch(err => console.log("error during authentication: ", err))
            }
        }
        
        listenToSignup(){
            const signupEl = document.getElementById("signup")
            const usernameEl = document.getElementById("signup-username")
            const emailEl = document.getElementById("signup-email")
            const passwordEl = document.getElementById("signup-password")
            const submitEl = signupEl.querySelector("input[type='submit']")
            const openSignup = document.getElementById("open-signup")
            
            openSignup.addEventListener("click", () => {
                signupEl.style.display = "block"
            })
            
            submitEl.addEventListener("click", () => {
                const username = usernameEl.value
                const email = emailEl.value
                const password = passwordEl.value
                
                const data = {username, email, password}
                
                axios.post(BASE_URL + "/player/signup", data)
                .then(response => {
                    this.storeToken(response.data.authToken)
                    this.authenticateUser()
                })
                .catch(err => console.log("Error during signup: ", err))
            })
        }
        
        listenToLogin(){
            const submitEl = document.querySelector("#login-form button")
        
            submitEl.addEventListener("click", () => {
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
        }
        
        listentToLogout(){
            const logoutEl = document.querySelector("#logout button")
            
            logoutEl.addEventListener("click", () => {
            localStorage.removeItem("authToken")
            this.isLoggedIn = false
        })
    }

    listenToCreateGame(){

    }
    
    listenToAcceptGame(){
        
    }
}