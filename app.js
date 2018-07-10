require('dotenv').config({path: 'config/application.env'});
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
app.io = io;
var port = process.env.PORT || 3000;
server.listen(port);
console.log('Server is listening on port ' + port);
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var bodyParser = require('body-parser');

// Mongo
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

require('./models/Authorization');
require('./models/Player');
require('./models/Team');
require('./models/Challenge');
require('./models/TeamChallenge');
require('./models/Alert');

var db_uri = process.env.MONGODB_URI;
if (!db_uri) {
	db_uri = 'mongodb://127.0.0.1/sparcPongDb';
	process.env.LADDER_URL = 'http://127.0.0.1:' + port;
    console.log('Defaulting to local mongodb instance at ' + db_uri);
}
mongoose.connect(db_uri);

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
var auth = require('./middleware/jwtMiddleware');
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
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function(err, req, res, next) {
	console.error(err);
	res.status(err.status || 500);
	res.json(err.message);
});



var SocketBank = require('./singletons/SocketBank');
var AuthService = require('./services/AuthService');

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
		var userId = credentials.playerId;
		var password = credentials.password;

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
