

// const userName = prompt('what is your username');
// const password = prompt('what is your password');

//Temp to remove prompt to save dev time
const userName = 'Aryan';
const password = 'X';

const clientOptions = {
    query: {
        userName,password
    },
    auth: {
        userName,password
    }
}


//always join the main namespace, because thats where the client gets the other namespaces from
const socket = io('http://localhost:9000',clientOptions);
// const socket1 = io('http://localhost:9000/wiki');
// const socket2 = io('http://localhost:9000/mozilla');
// const socket3 = io('http://localhost:9000/linux');

//sockets will be put into this array, in the index of their ns.id
const nameSpaceSockets = [];
const listeners = {
    nsChange: [],
    messageToRoom: [],
}

//a global variable we can update when the user clicks on a namespace
//we will use it to broadcast across the app (redux would be great here..)

let selectedNsId = 0;

//add a submit handler for our form
document.querySelector('#message-form').addEventListener('submit', e => {
    //keep the browser from submitting
    e.preventDefault();
    //grab the value from the input box
    const newMessage = document.querySelector('#user-message').value;
    console.log(newMessage,selectedNsId);
    nameSpaceSockets[selectedNsId].emit('newMessageToRoom',{
        newMessage,
        date: Date.now(),
        avatar: 'https://via.placeholder.com/30',
        userName,
        selectedNsId,
    })
    document.querySelector('#user-message').value = ""
})

//addListeners job is to manage all listeners added to all namespaces.
//this prevent listeners being added multiples times and makes life
//better for us as developers.
const addListeners = (nsId) => {
    
    if(!listeners.nsChange[nsId]){
    nameSpaceSockets[nsId].on('nsChange', (data) => {
        console.log("Namespace Changed");
        console.log(data)
    })
    listeners.nsChange[nsId] = true;
    } 
    if(!listeners.messageToRoom[nsId]){
        //add the nsId listener to this namespace!
        nameSpaceSockets[nsId].on('messageToRoom',messageObj => {
            console.log(messageObj);
            document.querySelector('#messages').innerHTML += buildMessageHtml(messageObj);
        })
        listeners.messageToRoom[nsId] = true;
    }
}
socket.on('connect', () => {
    console.log("connected");
    socket.emit('clientConnect');
})

//listen for the nsList event from the server which gives us the namespaces
socket.on('nsList', (nsData) => {
    const lastNs = localStorage.getItem('lastNs');
    console.log(nsData);
    const namespacesDiv = document.querySelector('.namespaces');
    namespacesDiv.innerHTML = "";
    nsData.forEach(ns => {
        //update the Html with each ns
        
        namespacesDiv.innerHTML += `<div class="namespace" ns="${ns.endpoint}"><img src="${ns.image}"></div>`
        //initialize thisNs as its index in nameSpaceSockets
        //if the connection is new,this will be null
        //if the connection has already been established, it will remain reconnect and remain in its spot
        //let thisNs = nameSpaceSockets[ns.id];

        if(!nameSpaceSockets[ns.id]) {
            //There is no socket at this nsId.so make a new connection
            //join this namespace with io()
            nameSpaceSockets[ns.id] = io(`http://localhost:9000${ns.endpoint}`)
        }

        addListeners(ns.id)

        //join this namespace with io()
        //const thisNs = io(`http://localhost:9000${ns.endpoint}`)
        //nameSpaceSockets[ns.id] = thisNs;
        // thisNs.on('nsChange', (data) => {
        //     console.log("Namespace Changed");
        //     console.log(data)
        // })
    });

    Array.from(document.getElementsByClassName('namespace')).forEach(element => {
        console.log(element);
        element.addEventListener('click', e => {
            joinNs(element,nsData);
        })
    })

    //if lastNs is set,grab that element instead of 0.
    joinNs(document.getElementsByClassName('namespace')[0], nsData)
})

// const buildMessageHtml = (messageObj) => 
    
//      `<li>
//          <div class="user-image">
//             <img src="${messageObj.avatar}" />
//         </div>
//         <div class="user-message">
//             <div class="user-name-time">${messageObj.userName}<span>  ${new Date(messageObj.date).toLocaleString()}</span></div>
//             <div class="message-text">${messageObj.newMessage}</div>
//         </div>
//     </li>`
