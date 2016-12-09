var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
app.io = io;
server.listen(process.env.PORT || '3000');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
require('dotenv').config({path: 'config/local.env'});

// Mongo
var mongoose = require('mongoose');

require('./models/Player');
require('./models/Team');
require('./models/Challenge');
require('./models/TeamChallenge');
require('./models/Alert');

var db_uri = process.env.MONGODB_URI;
mongoose.connect(db_uri);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Include scripts
app.use('/bower', express.static(path.join(__dirname, 'bower_components')));

app.use('/',								require('./routes/basic'));
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


// Socket Tracking Variables
var clients = 0;

// Socket Events
io.on('connection', function(socket) {
	console.log('New client connection...');
	io.sockets.emit('client:enter', ++clients);
	
	socket.on('disconnect', function() {
		io.sockets.emit('client:leave', --clients);
	});
});

module.exports = app;
