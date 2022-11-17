type ColorT = {
    RED: string
    GREEN: string
    BLUE: string
    YELLOW: string
    ORANGE: string
    PURPLE: string
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
    RED: "red",
    GREEN: "green",
    BLUE: "blue",
    YELLOW: "yellow",
    ORANGE: "orange",
    PURPLE: "purple",
    free: "lightgrey"
}

// text colors of fields and display elements
export const color: ColorT = {
    RED: "white",
    GREEN: "white",
    BLUE: "white",
    YELLOW: "black",
    ORANGE: "black",
    PURPLE: "white"
}

// font size of field values
export const fontSize: FontSizeT = {
    value1: "1rem",
    value2: "1.2rem",
    value3: "1.4rem",
    value4: "1.6rem"
}    
