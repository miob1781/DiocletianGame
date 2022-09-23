import {Game} from "./Game.js"
import {Account} from "./Account.js"

// instantiating classes
const account = new Account()
const game = new Game()

// running event listeners
account.hideOrOpen()
account.addListeners()

// starting a new game
game.getInput()
game.createBoard()
