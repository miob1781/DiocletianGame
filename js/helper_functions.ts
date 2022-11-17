import { AccountT, FieldT, Move, PlayerT } from "./types"

// helper functions
// selects a random element from an array
export function selectRandomElement(arr: FieldT[]): FieldT {
    const index: number = Math.floor(arr.length * Math.random())
    const randomEl: FieldT = arr[index]
    return randomEl
}

// gets field by row and column
export function getField(fields: FieldT[], row: number, col: number): FieldT {
    const field: FieldT = fields.find(field => field.row === row && field.col === col)!
    return field
}

// shuffles array by the Fisher-Yates algorithm
export function shuffleArray(arr: PlayerT[]): PlayerT[] {
    for (let i: number = arr.length - 1; i > 0; i--) {
        const j: number = Math.floor(Math.random() * (i + 1));
        const temp: PlayerT = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr
}

// plays moves recursively
export function playMoves(account: AccountT, moveNum: number): void {
    const nextMove: Move = account.game!.moves.find(m => m.moveNum === moveNum + 1)!

    if (nextMove) {
        account.game!.setIsOn(nextMove.fieldId)
        playMoves(account, moveNum + 1)
    } else {
        account.socket!.emit("request missing move", {
            webGameId: account.game!.webGameId,
            moveNum: moveNum + 1
        })
    }
}
