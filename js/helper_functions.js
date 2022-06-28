// helper functions
export function selectRandomElement(arr){
    const index = Math.floor(arr.length * Math.random())
    const randomEl = arr[index]
    return randomEl
}

export function getField(fields, row, col){
    return fields.find(field => field.row === row && field.col === col)
}
