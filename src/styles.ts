type ColorT = {
    red: string
    green: string
    blue: string
    yellow: string
    orange: string
    purple: string
    free?: string
}

export type FontSizeT = {
    value1: string
    value2: string
    value3: string
    value4: string
}

// background colors of fields and display elements
export const backgroundColor: ColorT = {
    red: "red",
    green: "green",
    blue: "blue",
    yellow: "yellow",
    orange: "orange",
    purple: "purple",
    free: "lightgrey"
}

// text colors of fields and display elements
export const color: ColorT = {
    red: "white",
    green: "white",
    blue: "white",
    yellow: "black",
    orange: "black",
    purple: "white"
}

// font size of field values
export const fontSize: FontSizeT = {
    value1: "1rem",
    value2: "1.2rem",
    value3: "1.4rem",
    value4: "1.6rem"
}    
