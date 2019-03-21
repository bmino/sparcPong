const jwt = require('jsonwebtoken');
const AuthService = require('../services/AuthService');
const jwtSecret = AuthService.JWT_SECRET_KEY;
const jwtAuthHeaderPrefix = AuthService.JWT_AUTH_HEADER_PREFIX;
const jwtValidBeginningTime = AuthService.JWT_REJECT_IAT_BEFORE;

function authorizationHeaderExists(req, res, next) {
    if (!req.headers || !req.headers.authorization) {
        return res.status(401).send('No Authorization header');
    }

    let authHeader = req.headers.authorization.split(' ');

    if (authHeader.length <= 1) {
        return res.status(401).send('Invalid Authorization header. No credentials provided');
    }

    if (authHeader[0].toLowerCase() !== jwtAuthHeaderPrefix.toLowerCase()) {
        return res.status(401).send('Unexpected Authorization header prefix');
    }

    next();
}

function validateJWT(req, res, next) {
    try {
        const jwtToken = req.headers.authorization.split(' ')[1];
        const payload = jwt.verify(jwtToken, jwtSecret);
        if (!payload || !payload.iat) return res.status(401).send('JWT security token did not contain an \'issued at time\'');
        if (payload.iat < jwtValidBeginningTime) return res.status(401).send('Jwt security token is outdated');
    } catch (err) {
        console.error(err);
        return res.status(401).send('Could not validate jwt security token');
    }

    next();
}

function makeTokenAvailable (req, res, next) {
    let authHeader = req.headers.authorization.split(' ');
    req.token = authHeader[1];
    next();
}

exports.jwtAuthProtected = [
    authorizationHeaderExists,
    validateJWT,
    makeTokenAvailable
];
