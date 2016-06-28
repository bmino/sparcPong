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
router.post('/', function(req, res) {
	var player = new Player();
	player.name = req.body.name;
	player.phone = req.body.phone;
	player.email = req.body.email;
	
	player.save(function(err) {
		if (err) {
			res.send(err);
		}
		res.json({message: 'Player created!'});
	});
});

/* GET player listing */
router.get('/', function(req, res) {
	Player.find({}, function(err, players) {
		if (err) {
			res.send(err);
		}
		res.json(players);
	})
});

/* GET player by name
 *
 * @param: name
 */
 router.get('/:name', function(req, res) {
	// TODO: implement
});

/* PUT updated player */
router.put('/', function(req, res) {
	// TODO: implement
	res.json({message: 'Not implemented yet.'});
	console.log('PUT player not implemented.');
});

/* DELETE player */
router.delete('/', function(req, res) {
	var playerId = req.params.playerId;
	Player.remove({_id: playerId}, function(err, player) {
		if (err) {
			res.send(err);
		}
		res.json({message: 'Succesfully deleted player.'});
	});
});



module.exports = router;
