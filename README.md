# Diocletian
My game for the first project week at Ironhack, built with vanilla JavaScript

Diocletian is a game for 2-6 players. When its their turn, the player can click on a field which is occupied by their own color. This will increase the value of the field by 1. Once the value is greater than the number of the neighboring fields, the value of the field will be set to 1 and the value of thet neighboring fields will be increased by 1. A thick boarder between two fields indicates that these fields are not considered neighboring. All the neighboring fields now belong to the player. If the value of one of these fields is greater than the number of the neighboring fields, they will again overflow to the neighboring fields until no field overflows. Then it's the next player's turn. The winner is the last player on the board.

The game has a menu in which the number of players can be set as well as which player is played by a human and which by the computer. In addition, the size of the board and the initial density can be selected.

# Demo
https://miob1781.github.io/Diocletian/
