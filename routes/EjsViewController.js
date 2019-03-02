let express = require('express');
let router = express.Router();
let version = require('../package.json').version;

/**
 * Get home page
 */
router.get('/', function(req, res, next) {
	res.render('index', {
		version: version
	});
});

module.exports = router;
