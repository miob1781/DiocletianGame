import {Game} from "./Game.js"
import {Account} from "./Account.js"

// initial scripts when the page is rendered: authentication, controlling display and running event listeners
const account = new Account()
account.authenticateUser()
account.hideOrOpen()
account.addListeners()

// starting a new game when rendering the page
const game = new Game(4, 6, "sparse", ["red"], account.username)
game.createBoard()
game.startGame()
