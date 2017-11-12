var express = require('express');
var router = express.Router();

/**
 * Get home page
 */
router.get('/', function(req, res, next) {
	res.render('index');
});

module.exports = router;
