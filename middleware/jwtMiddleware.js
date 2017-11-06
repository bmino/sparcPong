var jwt = require('jsonwebtoken');
var AuthService = require('../services/AuthService');
var jwtSecret = AuthService.JWT_SECRET_KEY;
var jwtAuthHeaderPrefix = AuthService.JWT_AUTH_HEADER_PREFIX;
var jwtValidBeginningTime = AuthService.JWT_REJECT_IAT_BEFORE;

/**
 * Ensures that a request has supplied an authorization header.
 */
exports.ensureAuthorizationHeaderExists = function (req, res, next) {
    if (!req.headers || !req.headers.authorization) {
        return res.status(401).send(new Error('No Authorization header.'));
    }

    var authHeader = req.headers.authorization.split(' ');

    if (authHeader.length === 1) {
        return res.status(401).send(new Error('Invalid Authorization header. No credentials provided.'));
    }

    if (authHeader[0].toLowerCase() !== jwtAuthHeaderPrefix.toLowerCase()) {
        return res.status(401).send(new Error('Unexpected Authorization header prefix.'));
    }

    next();
};


/**
 * Validates a JWT token.
 */
exports.validateJWTAuth = function (req, res, next) {
    var authHeader = req.headers.authorization.split(' ');

    var jwtToken = authHeader[1];
    jwt.verify(jwtToken, jwtSecret, function (err, payload) {
        console.log(err);
        if (err) return res.status(401).send(new Error('Could not validate jwt security token.'));

        if (payload.iat < jwtValidBeginningTime)
            return res.status(401).send(new Error('Jwt security token is too old.'));

        next();
    });
};




/**
 * The grouped middleware needed to enforce jwt Auth
 */
exports.jwtAuthProtected = [
    exports.ensureAuthorizationHeaderExists,
    exports.validateJWTAuth
];
