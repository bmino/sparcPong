require('dotenv').config({path: 'config/application.env'});
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
app.io = io;
var port = process.env.PORT || 3000;
server.listen(3000);
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
	console.log('Defaulting to local instance.');
	db_uri = 'mongodb://127.0.0.1/sparcPongDb';
	process.env.LADDER_URL = 'http://127.0.0.1:' + port;
}
mongoose.connect(db_uri);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(morgan(process.env.MORGAN_FORMAT || 'tiny'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Include scripts
app.use('/bower', express.static(path.join(__dirname, 'bower_components')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// JWT Security
var auth = require('./middleware/jwtMiddleware');
app.use(['/api/team/*', '/api/challenge/*', '/api/playerAlerts/*', '/api/envBridge/*'], auth.jwtAuthProtected);

app.use('/',								require('./routes/basic'));
app.use('/auth',							require('./routes/authorization'));
app.use('/api/player',						require('./routes/player'));
app.use('/api/team',						require('./routes/team'));
app.use('/api/challenge/player',			require('./routes/challenges/playerChallenge'));
app.use('/api/challenge/team',				require('./routes/challenges/teamChallenge'));
app.use('/api/playerAlerts',				require('./routes/alert'));
app.use('/api/envBridge',					require('./routes/envBridge'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: err
	});
});



var SocketBank = require('./singletons/SocketBank');

// Socket Events
io.on('connection', function(socket) {
	console.log('New client socket connection...');
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

	socket.on('logout', function(userId) {
		SocketBank.logoffUser(userId);
		io.sockets.emit('client:online', SocketBank.getOnlineClientIds());
	});
});

module.exports = app;
