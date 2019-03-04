const AuthService = require('./AuthService');

const SocketService = {
    IO: null,
    SOCKETS: {},

    init(io) {
        SocketService.IO = io;

        SocketService.IO.on('connection', function(socket) {
            console.log('New socket connection...');
            SocketService.addSocket(socket);

            // Notify all clients of presence
            SocketService.IO.sockets.emit('client:enter', SocketService.getClientCount());

            // Give initial list of online users
            socket.emit('client:online', SocketService.getOnlineClientIds());

            socket.on('disconnect', function() {
                console.log('Disconnected socket connection...');
                SocketService.removeSocket(socket);
                SocketService.IO.sockets.emit('client:online', SocketService.getOnlineClientIds());
                SocketService.IO.sockets.emit('client:leave', SocketService.getClientCount());
            });

            socket.on('login', function(credentials) {
                console.log('Received "login" socket event.');
                let userId = credentials.playerId;
                let password = credentials.password;

                AuthService.login(userId, password)
                    .then(function(token) {
                        SocketService.loginUser(userId, socket);
                        SocketService.IO.sockets.emit('client:online', SocketService.getOnlineClientIds());
                        socket.emit('login:success', token);
                    })
                    .catch(function(err) {
                        console.error(err);
                        socket.emit('login:error', err.message);
                    });
            });

            socket.on('flash', function(token) {
                console.log('Received "flash" socket event.');
                AuthService.flash(token)
                    .then(function(payload) {
                        SocketService.loginUser(payload.playerId, socket);
                        SocketService.IO.sockets.emit('client:online', SocketService.getOnlineClientIds());
                        socket.emit('flash:success', token);
                    })
                    .catch(function(err) {
                        socket.emit('flash:error', err.message);
                    });
            });

            socket.on('logout', function(userId) {
                console.log('Received "logout" socket event.');
                SocketService.logoffUser(userId, socket);
                SocketService.IO.sockets.emit('client:online', SocketService.getOnlineClientIds());
            });
        });
    },

    getClientCount() {
        return Object.keys(SocketService.SOCKETS).length;
    },

    getOnlineClientIds() {
        let uniqueIds = [];
        Object.keys(SocketService.SOCKETS).forEach(function(socketId) {
            let socket = SocketService.SOCKETS[socketId];
            let userId = socket.userId;
            if (!userId) return;
            if (uniqueIds.indexOf(userId) < 0) uniqueIds.push(userId);
        });
        return uniqueIds;
    },

    addSocket(socket) {
        SocketService.SOCKETS[socket.id] = socket;
    },

    removeSocket(socket) {
        SocketService.logoffUser(socket.userId, socket);
        delete SocketService.SOCKETS[socket.id];
    },

    loginUser(userId, socket) {
        console.log(`Login from userId: ${userId}`);
        SocketService.attachUserIdToSocket(userId, socket);
    },

    logoffUser(userId, socket) {
        console.log(`Logout from userId: ${userId}`);
        delete socket.userId;
    },

    attachUserIdToSocket(userId, socket) {
        let currentSocket = SocketService.SOCKETS[socket.id];
        currentSocket.userId = userId;
    }
};


module.exports = SocketService;
