const express = require('express');
const router = express.Router();
const version = require('../package.json').version;

/**
 * Get home page
 */
router.get('/', function(req, res, next) {
    res.render('index', {
        version: version
    });
});

module.exports = router;
