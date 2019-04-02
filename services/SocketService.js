const AuthService = require('./AuthService');

const SocketService = {
    IO: null,
    SOCKETS: {},

    init(io) {
        SocketService.IO = io;

        SocketService.IO.on('connection', (socket) => {
            console.log('New socket connection...');
            SocketService.addSocket(socket);

            // Notify all clients of presence
            SocketService.IO.sockets.emit('client:enter', SocketService.getClientCount());

            // Give initial list of online users
            socket.emit('client:online', SocketService.getOnlineClientIds());

            socket.on('disconnect', () => {
                console.log('Disconnected socket connection...');
                SocketService.removeSocket(socket);
                SocketService.IO.sockets.emit('client:online', SocketService.getOnlineClientIds());
                SocketService.IO.sockets.emit('client:leave', SocketService.getClientCount());
            });

            socket.on('login', ({ playerId, password }) => {
                console.log('Received "login" socket event.');

                AuthService.login(playerId, password)
                    .then((token) => {
                        SocketService.loginUser(playerId, socket);
                        SocketService.IO.sockets.emit('client:online', SocketService.getOnlineClientIds());
                        socket.emit('login:success', token);
                    })
                    .catch((err) => {
                        console.error(err);
                        socket.emit('login:error', err.message);
                    });
            });

            socket.on('flash', (token) => {
                console.log('Received "flash" socket event.');
                AuthService.flash(token)
                    .then((payload) => {
                        SocketService.loginUser(payload.playerId, socket);
                        SocketService.IO.sockets.emit('client:online', SocketService.getOnlineClientIds());
                        socket.emit('flash:success', token);
                    })
                    .catch((err) =>  {
                        socket.emit('flash:error', err.message);
                    });
            });

            socket.on('logout', (userId) => {
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
        Object.keys(SocketService.SOCKETS).forEach((socketId) => {
            const userId = SocketService.SOCKETS[socketId].userId;
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
