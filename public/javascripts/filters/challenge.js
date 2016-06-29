angular.module('filters')
.filter('challenge', function() {
	return function (incoming, info) {
		var challenges = [];
		
		if (!incoming) return challenges;
		var type = info.type;
		var playerId = info.id;
		
		// For each challenge
		for (var c=0; c<incoming.length; c++) {
			if (incoming[c].winner != null && type == 'resolved') {
				challenges.push(incoming[c]);
			} else if (incoming[c].winner == null) {
				// Ensures challenge is open
				if (type == 'incoming' && incoming[c].challengee == playerId) {
					challenges.push(incoming[c]);
				} else if (type == 'outgoing' && incoming[c].challenger == playerId) {
					challenges.push(incoming[c]);
				}
			}	
		}
		
		return challenges.sort(challengeSort);
	}
	
	function challengeSort(a, b) {
		return a.createdAt > b.createdAt;
	}
});

