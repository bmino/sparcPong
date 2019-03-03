require('dotenv').config({path: 'config/application.env'});

// Mongo
require('./models/index.js');
require('mongoose').connect(process.env.MONGODB_URI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    promiseLibrary: global.Promise
});

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
app.io = io;
if (!process.env.PORT) process.env.PORT = 3000;
server.listen(process.env.PORT, () => {
    console.log(`Server is listening on port ${process.env.PORT}`);
});
const path = require('path');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const SocketBank = require('./singletons/SocketBank');
const AuthService = require('./services/AuthService');

// Start Server
server.listen(process.env.PORT, () => {
	console.log(`Server is listening on port ${process.env.PORT}`);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
if (process.env.MORGAN_FORMAT) {
	app.use(morgan(process.env.MORGAN_FORMAT));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Include scripts
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// JWT Security
const auth = require('./middleware/jwtMiddleware');
app.use(['/api/team/*', '/api/challenge/*', '/api/playerAlerts/*', '/api/envBridge/*'], auth.jwtAuthProtected);

app.use('/',								require('./routes/EjsViewController'));
app.use('/auth',							require('./routes/AuthorizationController'));
app.use('/api/player',						require('./routes/PlayerController'));
app.use('/api/team',						require('./routes/TeamController'));
app.use('/api/challenge/player',			require('./routes/challenges/PlayerChallengeController'));
app.use('/api/challenge/team',				require('./routes/challenges/TeamChallengeController'));
app.use('/api/playerAlerts',				require('./routes/AlertController'));
app.use('/api/envBridge',					require('./routes/EnvironmentBridgeController'));
app.use('/manual',							require('./routes/ManualTaskController'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	let err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function(err, req, res, next) {
	console.error(err);
	res.status(err.status || 500);
	res.json(err.message);
});



const SocketBank = require('./singletons/SocketBank');
const AuthService = require('./services/AuthService');

// Socket Events
io.on('connection', function(socket) {
	console.log('New socket connection...');
	SocketBank.addSocket(socket);

	// Notify all clients of presence
	io.sockets.emit('client:enter', SocketBank.getClientCount());

	// Give initial list of online users
	socket.emit('client:online', SocketBank.getOnlineClientIds());

	socket.on('disconnect', function() {
		console.log('Disconnected socket connection...');
		SocketBank.removeSocket(socket);
		io.sockets.emit('client:online', SocketBank.getOnlineClientIds());
		io.sockets.emit('client:leave', SocketBank.getClientCount());
	});

	socket.on('login', function(credentials) {
		console.log('Received \'login\' socket event.');
		let userId = credentials.playerId;
		let password = credentials.password;

		AuthService.login(userId, password)
			.then(function(token) {
                SocketBank.loginUser(userId, socket);
                io.sockets.emit('client:online', SocketBank.getOnlineClientIds());
				socket.emit('login:success', token);
			})
			.catch(function(err) {
				console.error(err);
				socket.emit('login:error', err.message);
			});
	});

	socket.on('flash', function(token) {
        console.log('Received \'flash\' socket event.');
		AuthService.flash(token)
			.then(function(payload) {
                SocketBank.loginUser(payload.playerId, socket);
                io.sockets.emit('client:online', SocketBank.getOnlineClientIds());
                socket.emit('flash:success', token);
            })
			.catch(function(err) {
				socket.emit('flash:error', err.message);
			});
	});

	socket.on('logout', function(userId) {
		console.log('Received \'logout\' socket event.');
		SocketBank.logoffUser(userId, socket);
		io.sockets.emit('client:online', SocketBank.getOnlineClientIds());
	});
});

module.exports = app;
