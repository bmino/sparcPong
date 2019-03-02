let jwt = require('jsonwebtoken');
let AuthService = require('../services/AuthService');
let jwtSecret = AuthService.JWT_SECRET_KEY;
let jwtAuthHeaderPrefix = AuthService.JWT_AUTH_HEADER_PREFIX;
let jwtValidBeginningTime = AuthService.JWT_REJECT_IAT_BEFORE;

/**
 * Ensures that a request has supplied an authorization header.
 */
exports.authorizationHeaderExists = function (req, res, next) {
    if (!req.headers || !req.headers.authorization) {
        return res.status(401).send('No Authorization header.');
    }

    let authHeader = req.headers.authorization.split(' ');

    if (authHeader.length === 1) {
        return res.status(401).send('Invalid Authorization header. No credentials provided.');
    }

    if (authHeader[0].toLowerCase() !== jwtAuthHeaderPrefix.toLowerCase()) {
        return res.status(401).send('Unexpected Authorization header prefix.');
    }

    next();
};


/**
 * Validates a JWT token.
 */
exports.validateJWT = function (req, res, next) {
    let authHeader = req.headers.authorization.split(' ');

    try {
        let jwtToken = authHeader[1];
        let payload = jwt.verify(jwtToken, jwtSecret);
    } catch (err) {
        console.error(err);
        return res.status(401).send('Could not validate jwt security token.');
    }

    if (!payload || !payload.iat) {
        return res.status(401).send('JWT security token did not contain an \'issued at time.\'');
    }

    if (payload.iat < jwtValidBeginningTime) {
        return res.status(401).send('Jwt security token is outdated.');
    }

    next();
};

function makeTokenAvailable (req, res, next) {
    let authHeader = req.headers.authorization.split(' ');
    req.token = authHeader[1];
    next();
}




exports.jwtAuthProtected = [
    exports.authorizationHeaderExists,
    exports.validateJWT,
    makeTokenAvailable
];
