# Diocletian

Diocletian is a tactical game for 2-6 players. When its their turn, the player can click on a field which is occupied by their own color. This will increase the value of the field by 1. Once the value is greater than the number of the neighboring fields, the value of the field will be set to 1 and the value of thet neighboring fields will be increased by 1. A thick boarder between two fields indicates that these fields are not considered neighboring. All the neighboring fields now belong to the player. If the value of one of these fields is greater than the number of the neighboring fields, they will again overflow to the neighboring fields until no field overflows. Then it's the next player's turn. The winner is the last player on the board.

The game can be played against other players at the same computer or on the web. For the latter option, players need to sign up for an account. The person who invites other players can choose the number of players, the size of the board and its initial density.

Diocletian has been built with TypeScript, axios, websockets (socket.io), and webpack. The repository for the server can be found [here](https://github.com/miob1781/diocletian-server).

## Demo
Go to the demo [here](https://miob1781.github.io/diocletian).
