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
	var playerName = req.body.name;
	
	// Verify player name is new
	Player.count({name: playerName}, function(err,count) {
		if (err) {
			return next(err);
		} else if (count != 0) {
			return next(new Error('Player name already exists.'));
		} else {
			// Create new player
			var player = new Player();
			player.name = playerName;
			player.phone = req.body.phone;
			player.email = req.body.email;
			
			// Saves player to DB
			player.save(function(err, saved) {
				if (err) {
					return next(err);
				} else {
					res.json({message: 'Player created!'});
				}
			});
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

/* GET player by id */
router.get('/fetch/:playerId', function(req, res, next) {
	var playerId = req.params.playerId;
	
	if (!playerId)
		return next(new Error('You must specify a player id.'));
	
	Player.findById(playerId, function(err, players) {
		if (err) {
			return next(err);
		} else if (!players) {
			console.log('Could not find player with id: ' + playerId);
			return next(new Error('No player was found for that id.'));
		} else {
			res.json({message: players});
		}
	})
});

/* DELETE player */
router.delete('/', function(req, res) {
	var playerId = req.body.playerId;
	
	if (!playerId)
		return next(new Error('You must specify a player id.'));
	
	Player.remove({_id: playerId}, function(err, player) {
		if (err) {
			return next(err);
		} else {
			res.json({message: 'Successfully deleted player.'});
		}
	});
});



module.exports = router;
