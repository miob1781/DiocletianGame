// helper functions
// selects a random element from an array
export function selectRandomElement(arr){
    const index = Math.floor(arr.length * Math.random())
    const randomEl = arr[index]
    return randomEl
}

// gets field by row and column
export function getField(fields, row, col){
    return fields.find(field => field.row === row && field.col === col)
}

// shuffles array by the Fisher-Yates algorithm
export function shuffleArray(arr){
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr
  }
  