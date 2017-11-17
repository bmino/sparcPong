/*
 * Calculates the tier for a given ranking.
 *
 * @param: rank
 * @return: number - tier
 */
module.exports.getTier = function(rank) {
    var tier = 1;
    var tierRanks = [];
    while (tierRanks.indexOf(rank) === -1) {
        tierRanks = module.exports.getRanks(tier++);
    }
    return tier;
};

/*
 * Calculates the possible ranks for a given tier.
 *
 * @param: tier
 * @return: array - contains possible ranks
 */
module.exports.getRanks = function(tier) {
    var ranks = [];
    var first = (tier * (tier-1) + 2) / 2;
    for (var r=0; r<tier; r++)
        ranks.push(first+r);
    return ranks;
};


/*
 * Adds business days to a date.
 *
 * @param: date - the starting date
 * @param: days - number of days to add
 */
module.exports.addBusinessDays = function(date, days) {
    // Bad Inputs
    if (!days) return date;
    var newDate = new Date(date.getTime());
    var added = 0;
    while (added < days) {
        // Looks at tomorrow's day
        newDate.setDate(newDate.getDate()+1);
        if (module.exports.isBusinessDay(newDate)) {
            added++;
        }
    }
    return newDate;
};

/*
 * Adds regular days to a date.
 *
 * @param: date - the starting date
 * @param: days - number of days to add
 */
module.exports.addDays = function(date, days) {
    // Bad Inputs
    if (!days) return date;
    var newDate = new Date(date.getTime());
    newDate.setDate(newDate.getDate()+parseInt(days));
    return newDate;
};

/*
 * Adds hours to a date.
 *
 * @param: date - the starting date
 * @param: hours - number of hours to add
 */
module.exports.addHours = function(date, hours) {
    // Bad Inputs
    if (!hours) return date;
    var newDate = new Date(date.getTime());
    newDate.setHours(newDate.getHours()+parseInt(hours));
    return newDate;
};

/*
 * Adds minutes to a date.
 *
 * @param: date - the starting date
 * @param: minutes - number of minutes to add
 */
module.exports.addMinutes = function(date, minutes) {
    // Bad Inputs
    if (!minutes) return date;
    var newDate = new Date(date.getTime());
    newDate.setMinutes(newDate.getMinutes()+parseInt(minutes));
    return newDate;
};

/*
 * Determines if the given date is a business day.
 *
 * @param: date
 */
module.exports.isBusinessDay = function(date) {
    return date.getDay() !== 0 && date.getDay() !== 6;
};