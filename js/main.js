import { Account } from "./Account.js"

// initial scripts when the page is rendered: authentication, controlling display and running event listeners
const account = new Account()

account.authenticateUser()
account.hideOrOpen()
account.addListeners()
