import {WebGame} from "./WebGame"
import axios from "axios"

export class Account {
    constructor(){
        id = null
        username = null
        email = null
        createdGame = null
        invitedGames = null
        oldGames = null
    }
    signup(){
        const usernameEl = document.getElementById("signup-username")
        const emailEl = document.getElementById("signup-email")
        const passwordEl = document.getElementById("signup-password")
        const submitEl = document.querySelector("#signup-form input[type='submit']")
        
        const username = usernameEl.value
        const email = emailEl.value
        const password = passwordEl.value
        
        const data = {username, email, password}
        
        submitEl.addEventListener("click", e => {
            e.preventDefault()
            axios.post(process.env.SERVER_URL, data)
                .then(response => {
                    const {id, username, email} = response.data
                    this.id = id
                    this.username = username
                    this.email = email
                })
                .catch(err => console.log("error during signup: ", err))
            })
        }
        
        login(){
            const usernameEl = document.getElementById("login-username")
            const emailEl = document.getElementById("login-email")
            const passwordEl = document.getElementById("login-password")
            const submitEl = document.querySelector("#login-form input[type='submit']")
            
            const username = usernameEl.value
            const email = emailEl.value
            const password = passwordEl.value
            
            const data = {username, email, password}
            
            submitEl.addEventListener("click", e => {
                e.preventDefault()
                axios.post(process.env.SERVER_URL, data)
                .then(response => {
                    const {id, username, email, createdGame, invitedGames, oldGames} = response.data
                    this.id = id
                    this.username = username
                    this.email = email
                    this.createdGame = createdGame
                    this.invitedGames = invitedGames
                    this.oldGames = oldGames
                })
                .catch(err => console.log("error during login: ", err))
        })
    }
    createGame(){

    }
    acceptGame(){

    }
}