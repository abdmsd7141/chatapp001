

const express = require('express');
const app = express();
//require('socket.io') = Server in the docs
const socketio = require('socket.io')

//Normally this should be coming from database 
const namespaces = require('./Data/namespaces');
const Room = require('./classes/Room');

//console.log(namespaces)


app.use(express.static(__dirname + '/public'));

const expressServer = app.listen(9000);

//io = the server object in the docs
const io = socketio(expressServer);

//app.set('io',io);

// manufactured way to change an ns (without building a huge UI)
app.get('/change-ns', (req, res) => {
    // update the namespaces array
    namespaces[0].addRoom(new Room(0, 'Deleted Articles', 0))
    // let everyone know in this namespace, that it changed
    //const io = app.get('io');
    io.of(namespaces[0].endpoint).emit('nsChange',namespaces[0]);
    res.json(namespaces[0]);
})

io.use((socket,next) => {
    const jwt = socket.handshake.query.jwt;
    console.log(jwt);
    if(true){
        next()
    } else{
        console.log("Goodbye")
        socket.disconnect()
    }
})

io.on('connection', (socket) => {

    // console.log("==================");
    // console.log(socket.handshake);

    const userName = socket.handshake.query.userName;
    //using jwt
    const jwt = socket.handshake.query.jwt;
    //console.log(socket.id, 'has connected')
    //in websocket we use 'send' method, and in socket.io we use the 'emit' method
    socket.emit('welcome',"welcome to the server");
     socket.on('clientConnect', (data) => {
         console.log(socket.id, 'has connected')
     })

    socket.emit('nsList', namespaces)
   
})


namespaces.forEach(namespace => {
    //const thisNs = io.of(namespace.endpoint)
    io.of(namespace.endpoint).on('connection', (socket) => {
        //console.log(`${socket.id} has connected to ${namespace.endpoint}`)
        socket.on('joinRoom', async (roomObj,ackCallBack) => {
            //need to fetch history
            const thisNs = namespaces[roomObj.namespaceId];
            const thisRoomObj = thisNs.rooms.find(room => room.roomTitle === roomObj.roomTitle)
            const thisRoomsHistory = thisRoomObj.history;

            //leave all rooms (except own room), because the client can only be in one room
            const rooms = socket.rooms;
            //console.log(rooms);
            let i = 0;
            rooms.forEach( room => {
                //we don't want to leave the socket's personal room which is guranteed to be first
                if(i !== 0){
                    socket.leave(room);
                }
                i++;
            })

            //join the room
            //NOTE  - roomTitle is coming from the client, which is NOT safe.
            // Auth to make sure the socket has right to be in that room
            socket.join(roomObj.roomTitle);

            //fetch the number of sockets in this room
            const sockets = await io.of(namespace.endpoint).in(roomObj.roomTitle).fetchSockets()
            //console.log(sockets);
            const socketCount = sockets.length;

            ackCallBack({
                numUsers: socketCount,
                thisRoomsHistory,
            })
        })
        socket.on('newMessageToRoom',messageObj => {
            console.log(messageObj);
            //broadcast this to all connected clients...this room only
            //how can we find out what room this socket is in?
            const rooms = socket.rooms;
            const currentRoom = [...rooms][1]; //this is a set Not an array
            io.of(namespace.endpoint).in(currentRoom).emit('messageToRoom',messageObj);
            //add this message to this room's history
            const thisNs = namespaces[messageObj.selectedNsId];
            const thisRoom = thisNs.rooms.find(room => room.roomTitle ===currentRoom);
            console.log(thisRoom);
            thisRoom.addMessage(messageObj);
        })
    })
})

