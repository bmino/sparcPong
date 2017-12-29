var SocketBank = {
    SOCKETS: {},

    getClientCount : getClientCount,
    getOnlineClientIds : getOnlineClientIds,

    addSocket : addSocket,
    removeSocket : removeSocket,

    loginUser : loginUser,
    logoffUser : logoffUser
};

module.exports = SocketBank;


function getClientCount() {
    return Object.keys(this.SOCKETS).length;
}

function getOnlineClientIds() {
    var uniqueIds = [];
    Object.keys(this.SOCKETS).forEach(function(socketId) {
        var socket = SocketBank.SOCKETS[socketId];
        var userId = socket.userId;
        if (!userId) return;
        if (uniqueIds.indexOf(userId) < 0) uniqueIds.push(userId);
    });
    return uniqueIds;
}

function addSocket(socket) {
    this.SOCKETS[socket.id] = socket;
}

function removeSocket(socket) {
    this.logoffUser(socket.userId, socket);
    delete this.SOCKETS[socket.id];
}

function loginUser(userId, socket) {
    console.log('Login from userId: '+ userId);
    attachUserIdToSocket(userId, socket);
}

function logoffUser(userId, socket) {
    console.log('Logout from userId: '+ userId);
    delete socket.userId;
}


function attachUserIdToSocket(userId, socket) {
    var currentSocket = SocketBank.SOCKETS[socket.id];
    currentSocket.userId = userId;
}
