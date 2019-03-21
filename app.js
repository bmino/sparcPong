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
const path = require('path');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const SocketService = require('./services/SocketService');
SocketService.init(require('socket.io')(server));

// Start Server
server.listen(process.env.PORT, () => {
    console.log(`Server is listening on port ${process.env.PORT}`);
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
if (process.env.MORGAN_FORMAT) app.use(morgan(process.env.MORGAN_FORMAT));


// JWT Security
app.use(['/api/challenge*', '/api/playerAlerts*', '/api/envBridge*'], auth.jwtAuthProtected);

app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

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
app.use((req, res, next) => {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500);
    res.json(err.message);
});


module.exports = app;
