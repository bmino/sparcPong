var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var port = 4200;

// Mongo
var mongoose = require('mongoose');

require('./models/Player');
require('./models/History');
require('./models/Challenge');

var db_uri = 'mongodb://localhost/myapp';
mongoose.connect(db_uri);


var routes = require('./routes/basic');
var player = require('./routes/player');
var history = require('./routes/history');
var challenge = require('./routes/challenge');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/player', player);
app.use('/history', history);
app.use('/challenge', challenge);


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

// Socket Handling
server.listen(port);

// Socket Events
io.on('connection', function(socket) {
	console.log('New connection...');
	socket.on('msg', function(data) {
		console.log('received: '+data);
	});
});

module.exports = app;
