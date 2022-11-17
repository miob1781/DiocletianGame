import { Socket } from "socket.io-client";

/** color of the player */
export enum Color {
    /** player is red */
    Red = "RED",
    /** player is blue */
    Blue = "BLUE",
    /** player is yellow */
    Yellow = "YELLOW",
    /** player is green */
    Green = "GREEN",
    /** player is orange */
    Orange = "ORANGE",
    /** player is purple */
    Purple = "PURPLE"
}

/** initial density of the board */
export enum Density {
    /** sparse density */
    Sparse = "SPARSE",
    /** medium density */
    Medium = "MEDIUM",
    /** dense density */
    Dense = "DENSE"
}

export enum GameType {
    /** game only on the computer of the user */
    Solo = "SOLO",
    /** game with other players on the web */
    Web = "WEB"
}

/** data of a human player */
export type PlayerData = {
    /** id of player */
    id: string,
    /** name of player */
    name: string
}

/** data for user authentication */
export type AuthData = {
    /** username */
    username: string,
    /** password */
    password: string
}

/** move of a player which is stored in an array of moves */
export type Move = {
    /** id of field */
    fieldId: number,
    /** number of move */
    moveNum: number
}

export type GameCreated = {
    id: string,
    numPlayers: number,
    size: number,
    density: Density,
    players: PlayerData[],
    creator: PlayerData
}

export type WebGameData = {
    numPlayers: number,
    size: number,
    density: Density,
    players: PlayerData[],
    creator: PlayerData
}

export type FieldData = {
    id: number,
    color: Color | null,
    value: number
}

export type HeadersT = { Authorization: string }

/** field */
export interface FieldT {
    /** field id */
    id: number
    /** field row */
    row: number
    /** field column */
    col: number
    /** field value */
    value: number
    /** field neighbors */
    neighbors: FieldT[]
    /** player on field */
    player: PlayerT | null
    /** current game */
    game: GameT | null
    /** field element in DOM */
    fieldEl: HTMLElement | null
    /** field value element in DOM */
    numEl: HTMLElement | null
    /** gets the neighboring fields of a field */
    getNeighbors(): void
    /** sets player, value and style of a field */
    setField(player: PlayerT, value: number): void
    /** selects the field of a move */
    selectField(clicking?: string): void
    /** increases the value of a field */
    increaseValue(): void
    /** selects the neighboring fields if the increased value of a field is greater than the number of neighbors*/
    overflow(): void
}

/** player */
export interface PlayerT {
    /** color of player */
    color: Color
    /** name of player */
    name: Color | string
    /** is it the player's turn? */
    isOn: boolean
    /** is the player played by the computer? */
    isComputer: boolean
    /** is the player played by an external human player? */
    isExternalPlayer: boolean
    /** fields belonging to the player */
    fields: FieldT[]
    /** total value of fields belonging to the player */
    totalValue: number
    /** display element of the player */
    playerDisplayEl: HTMLElement | null
    /** adds display for participating players and their values */
    setPlayerDisplayEl(): void
    /** calculates the number of fields and the total number of field values of a player */
    getPlayerValues(): void
}

/** current game */
export interface GameT {
    /** number of players participating in the game */
    numPlayers: number
    /** size of the board, i.e. number of rows and columns */
    size: number
    /** density of the initial board */
    density: Density
    /** names of players if human */
    humanPlayersNames: string[]
    /** name of player being logged in */
    username: string
    /** id of web game */
    webGameId: string | null
    /** socket */
    socket: Socket | null
    /** array with all fields of the board */
    fields: FieldT[]
    /** participating players */
    selectedPlayers: PlayerT[]
    /** players that have not dropped out */
    remainingPlayers: PlayerT[]
    /** array of moves, which are executed in the order of the move numbers */
    moves: Move[]
    /** player who is to move */
    playerOn: PlayerT | null
    /** move number */
    moveNum: number
    /** is the game running? */
    gameOn: boolean
    /** is the player the creator of the game? */
    playerIsCreator: boolean
    /** creates the board for a new game */
    createBoard(): void
    /** adds players and values to fields */
    addPlayers(): void
    /** assigns player to a field */
    assignPlayerToField(player: PlayerT, value: number): void
    /** creates the display for a new game */
    createDisplay(): void
    /** starts a new game */
    start(): void
    /** sets a player on so that the player can move */
    setIsOn(move?: number): void
    /** moves on to the next player */
    getNextPlayer(): void
    /** checks if a player has run out of fields and has thus left the game and if the game has ended */
    checkRemainingPlayers(player: PlayerT): void
    /** performs final actions when a game has ended */
    end(): void
}

/** web game object to prepare a game with other players online */
export interface WebGameT {
    /** id of player */
    playerId: string
    /** name of player */
    playerName: string
    /** id of the creator of the game */
    creatorId: string
    /** name of the creator of the game */
    creatorName: string
    /** human players participating in a web game */
    humanPlayers: PlayerData[]
    /** total number of players */
    numPlayers: number
    /** size of the board, i.e. number of rows and columns */
    size: number
    /** initial density of the board */
    density: Density
    /** id of web game */
    id: string | null
    /** socket */
    socket: Socket
    /** displays the messages and buttons to start a new game on the web */
    display(): void
    /** posts a new web game */
    postGame(): void
    /** deletes a web game when a player declined to participate or the creator revoked the invitation */
    deleteGame(): void
}

/** contains data of user and listeners */
export interface AccountT {
    /** id of user */
    id: string | null
    /** username stored in DB */
    username: string | null
    /** players that the user wants to invite */
    invitedPlayers: PlayerData[]
    /** players the user has already played with */
    connectedPlayers: PlayerData[] | null
    /** type of game */
    gameType: GameType | null
    /** socket */
    socket: Socket | null
    /** web game object to prepare a game with other players online */
    webGame: WebGameT | null
    /** current game */
    game: GameT | null
    /** is the user logged in? */
    isLoggedIn: boolean
    /** hides or opens elements during authentication depending on whether the player is logged in */
    hideOrOpen(): void
    /** loads the values of old games to get the connected players, the games open for partipation and the number of games played and won */
    loadGames(): void
    /** starts a new game with default values after authentication */
    startGame(): void
    /** handles logout */
    logout(): void
    /** authenticates a user and performs actions after authentication */
    authenticateUser(): void
    /** function used during authentication for either login or signup */
    handleLoginOrSignupRequest(url: string, data: AuthData): void
    /** displays invited players for a web game */
    displayInvitedPlayers(): void
    /** adds listeners to elements used by the Account class */
    addListeners(): void
    /** adds listeners for websockets */
    addSocketListeners(): void
}
