var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Player = mongoose.model('Player');

/* POST new player
 *
 * @param: name
 * @param: phone
 * @param: email
 */
router.post('/', function(req, res, next) {
	var player = new Player();
	player.name = req.body.name;
	player.phone = req.body.phone;
	player.email = req.body.email;
	
	player.save(function(err, saved, numAffected) {
		if (err) {
			return next(err);
		} else {
			res.json({message: 'Player created!'});
		}
	});
});

/* GET player listing */
router.get('/', function(req, res, next) {
	Player.find({}, function(err, players) {
		if (err) {
			return next(err);
		} else {
			res.json({message: players});
		}
	})
});

/* GET occurances of player name
 *
 * @param: name
 */
 router.get('/count/:name', function(req, res, next) {
	var playerName = req.params.name;
	Player.find({name: playerName}).count(function(err,count) {
		if (err) {
			return next(err);
		} else if (count != 0) {
			return next(new Error('Player name already exists.'));
		} else {
			// No occurances exist
			res.json({message: 'Found ' +count+ ' players with that name.'});
		}
	});
});

/* PUT updated player */
router.put('/', function(req, res) {
	// TODO: implement
	res.json({message: 'Not implemented yet.'});
	console.log('PUT player not implemented.');
});

/* DELETE player */
router.delete('/', function(req, res) {
	var playerId = req.body.playerId;
	Player.remove({_id: playerId}, function(err, player) {
		if (err) {
			return next(err);
		} else {
			res.json({message: 'Succesfully deleted player.'});
		}
	});
});



module.exports = router;
