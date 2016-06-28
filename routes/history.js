var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var History = mongoose.model('History');

/* POST new History
 *
 * @param: playerId
 * @param: oponnentId
 * @param: playerScore
 * @param: oponnentScore
 */
router.post('/', function(req, res) {
	var history = new History();
	history.playerId = req.body.playerId;
	history.opponentId = req.body.opponentId;
	history.playerScore = req.body.playerScore;
	history.oponnentScore = req.body.opponentScore;
	
	history.save(function(err) {
		if (err) {
			res.send(err);
		}
		res.json({message: 'History created!'});
	});
});

/* GET History listing */
router.get('/', function(req, res) {
	History.find({}, function(err, histories) {
		if (err) {
			res.send(err);
		}
		res.json(histories);
	})
});

/* PUT updated History */
router.put('/', function(req, res) {
	// TODO: implement
	res.json({message: 'Not implemented yet.'});
	console.log('PUT History not implemented.');
});

/* DELETE History
 *
 * @param: historyId
 */
router.delete('/', function(req, res) {
	var historyId = req.params.historyId;
	History.remove({_id: historyId}, function(err, history) {
		if (err) {
			res.send(err);
		}
		res.json({message: 'Succesfully deleted History.'});
	});
});



module.exports = router;
