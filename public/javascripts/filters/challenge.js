angular.module('filters')
.filter('challenge', function() {
	return function (incoming, info) {
		var challenges = [];
		
		if (!incoming) return challenges;
		var type = info.type;
		var playerId = info.id;
		
		// For each challenge
		for (var c=0; c<incoming.length; c++) {
			if (type == 'open' && incoming[c].winner == null)
				challenges.push(incoming[c]);
			} else if (type == 'incoming' && incoming[c].challengee == playerId) {
				challenges.push(incoming[c]);
			} else if (type == 'outgoing' && incoming[c].challenger == playerId) {
				challenges.push(incoming[c]);
			}	
		}
		
		return challenges.sort(challengeSort);
	}
	
	function challengeSort(a, b) {
		return a.createdAt > b.createdAt;
	}
});

