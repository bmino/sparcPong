const SocketBank = {
    SOCKETS: {},

    getClientCount() {
        return Object.keys(SocketBank.SOCKETS).length;
    },

    getOnlineClientIds() {
        let uniqueIds = [];
        Object.keys(SocketBank.SOCKETS).forEach(function(socketId) {
            let socket = SocketBank.SOCKETS[socketId];
            let userId = socket.userId;
            if (!userId) return;
            if (uniqueIds.indexOf(userId) < 0) uniqueIds.push(userId);
        });
        return uniqueIds;
    },

    addSocket(socket) {
        SocketBank.SOCKETS[socket.id] = socket;
    },

    removeSocket(socket) {
        SocketBank.logoffUser(socket.userId, socket);
        delete SocketBank.SOCKETS[socket.id];
    },

    loginUser(userId, socket) {
        console.log('Login from userId: '+ userId);
        SocketBank.attachUserIdToSocket(userId, socket);
    },

    logoffUser(userId, socket) {
        console.log('Logout from userId: '+ userId);
        delete socket.userId;
    },

    attachUserIdToSocket(userId, socket) {
        let currentSocket = SocketBank.SOCKETS[socket.id];
        currentSocket.userId = userId;
    }
};


module.exports = SocketBank;
