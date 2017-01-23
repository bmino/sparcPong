angular.module('filters')
.filter('tier', function() {
	return function (players, tier) {
		var tierPlayers = [];
		
		if (!players) return tierPlayers;
		
		// Calculate possible ranks for the tier
		var ranks = getRanks(tier);
		
		// For each player
		for (var p=0; p<players.length; p++) {
			var playerRank = players[p].rank;
			// For each rank
			for (var r=0; r<ranks.length; r++) {
				if (playerRank == ranks[r]) {
					tierPlayers.push(players[p]);
				}
			}
		}
		
		return tierPlayers.sort(playerSort);
	};
	
	function playerSort(a, b) {
		return a.rank > b.rank;
	}
	
	function getRanks(tier) {
        var ranks = [];
        var first = (tier * (tier-1) + 2) / 2;
        for (var r=0; r<tier; r++) {
            ranks.push(first+r);
        }
        return ranks;
	}
});
