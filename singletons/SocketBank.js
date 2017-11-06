var SocketBank = {
    SOCKETS: {},
    ONLINE_USER_IDS: [],

    getClientCount : getClientCount,
    getOnlineClientIds : getOnlineClientIds,

    addSocket : addSocket,
    removeSocket : removeSocket,

    loginUser : loginUser,
    logoffUser : logoffUser
};

module.exports = SocketBank;


function getClientCount() {
    var size = 0;
    for (var key in this.SOCKETS) {
        if (this.SOCKETS.hasOwnProperty(key)) size++;
    }
    return size;
}

function getOnlineClientIds() {
    var uniqueIds = [];
    for (var i=0; i<this.ONLINE_USER_IDS.length; i++) {
        var userId = this.ONLINE_USER_IDS[i];
        if (uniqueIds.indexOf(userId) < 0) uniqueIds.push(userId);
    }
    return uniqueIds;
}

function addSocket(socket) {
    this.SOCKETS[socket.id] = socket;
}

function removeSocket(socket) {
    delete this.SOCKETS[socket.id];
}

function loginUser(userId) {
    console.log('Login from userId: '+ userId);
    if (!isOnlineByUserId(userId)) this.ONLINE_USER_IDS.push(userId);
}

function logoffUser(userId) {
    console.log('Logout from userId: '+ userId);
    var index = this.ONLINE_USER_IDS.indexOf(userId);
    if (index >= 0) this.ONLINE_USER_IDS.splice(index, 1);
}


function isOnlineByUserId(userId) {
    return SocketBank.ONLINE_USER_IDS.indexOf(userId) !== -1;
}
