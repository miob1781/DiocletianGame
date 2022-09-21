import {Game} from "./Game.js"
import {Account} from "./Account.js"

// instantiating classes, running listeners and starting a new game
const account = new Account()
const game = new Game()

account.listenToSignup()
account.listenToLogin()
account.listentToLogout()

game.getInput()
game.createBoard()
