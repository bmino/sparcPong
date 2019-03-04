const Util = {
    getTier(rank) {
        if (rank < 1) return undefined;
        let tier = 1;
        let tierRanks = [];
        while (tierRanks.indexOf(rank) === -1) {
            tierRanks = Util.getRanks(tier++);
        }
        return tier;
    },

    getRanks(tier) {
        let ranks = [];
        let first = (tier * (tier-1) + 2) / 2;
        for (let r=0; r<tier; r++)
            ranks.push(first+r);
        return ranks;
    },

    addBusinessDays(date, days) {
        if (!days) return date;
        if (typeof date === 'number') date = new Date(date);
        let newDate = new Date(date.getTime());
        let added = 0;
        while (added < days) {
            // Looks at tomorrow's day
            newDate.setDate(newDate.getDate()+1);
            if (Util.isBusinessDay(newDate)) {
                added++;
            }
        }
        return newDate;
    },

    addHours(date, hours) {
        if (!hours) return date;
        if (typeof date === 'number') date = new Date(date);
        let newDate = new Date(date.getTime());
        newDate.setHours(newDate.getHours()+parseInt(hours));
        return newDate;
    },

    addMinutes(date, minutes) {
        if (!minutes) return date;
        if (typeof date === 'number') date = new Date(date);
        let newDate = new Date(date.getTime());
        newDate.setMinutes(newDate.getMinutes()+parseInt(minutes));
        return newDate;
    },

    isBusinessDay(date) {
        if (typeof date === 'number') date = new Date(date);
        return date.getDay() !== 0 && date.getDay() !== 6;
    }
};


module.exports = Util;
