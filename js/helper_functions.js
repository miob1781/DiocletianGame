// helper functions

// selects a random element from an array
export function selectRandomElement(arr) {
    const index = Math.floor(arr.length * Math.random())
    const randomEl = arr[index]
    return randomEl
}

// gets field by row and column
export function getField(fields, row, col) {
    return fields.find(field => field.row === row && field.col === col)
}

// shuffles array by the Fisher-Yates algorithm
export function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    return arr
}

// plays moves recursively
export function playMoves(account, moveNum) {
    const nextMove = account.game.moves.find(m => m.moveNum === moveNum - 1)

    if (nextMove) {
        account.game.setIsOn(nextMove.fieldId)
        console.log("move number of game after one loop iteration: ", account.game.moveNum);
        playMoves(account, moveNum + 1)

    } else {
        account.socket.emit("request missing move", {
            webGameId: account.game.webGameId,
            playerId: account.id,
            moveNum: moveNum + 1
        })
        console.log("requesting missing move, move number" + moveNum);
    }
}
