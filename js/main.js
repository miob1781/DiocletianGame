import {Game} from "./Game.js"
import {Account} from "./Account.js"

// instantiating classes
const account = new Account()
const game = new Game()

// initial scripts when the page is rendered: authentication, controlling display and running event listeners
account.authenticateUser()
account.hideOrOpen()
account.addListeners()

// starting a new game
// game.getInput()
game.createBoard()
