const express = require('express');
const router = express.Router();
const ManualTaskService = require('../services/ManualTaskService');

/**
 * Auto issue challenges to players
 * @param: key
 */
router.get('/challenge', (req, res, next) => {
    const { key } = req.query;

    if (!key || key !== process.env.JWT_SECRET_KEY) return res.json('Invalid key');

    ManualTaskService.autoChallenge()
        .then((issued) => {
            const msg = `Issued ${issued} challenges`;
            console.log(`[Manual] - ${msg}`);
            res.json(msg);
        })
        .catch(next);
});

/**
 * Auto forfeit challenges for singles and doubles
 * @param: key
 */
router.get('/forfeit', (req, res, next) => {
    const { key } = req.query;

	if (!key || key !== process.env.JWT_SECRET_KEY) return res.json('Invalid key');

	Promise.all([
        ManualTaskService.autoForfeitSingles(),
        ManualTaskService.autoForfeitDoubles()
    ])
        .then(([singlesResults, doublesResults]) => {
        	const msg = `Forfeited ${singlesResults.length} challenges (singles) and ${doublesResults.length} challenges (doubles)`;
        	console.log(`[Manual] - ${msg}`);
            res.json(msg);
        })
		.catch(next);
});

/**
 * Deactivate a player
 * @param: key
 * @param: id
 */
router.get('/deactivate', (req, res, next) => {
    const { key, id } = req.query;

    if (!key || key !== process.env.JWT_SECRET_KEY) return res.json('Invalid key');
    if (!id) return res.json('Missing id');

    return ManualTaskService.deactivatePlayer(id)
        .then(() => {
            const msg = 'Deactivated player';
            console.log(`[Manual] - ${msg}`);
            res.json(msg);
        })
        .catch(next);
});

/**
 * Re-activate a deactivated player
 * @param: key
 * @param: id
 */
router.get('/activate', (req, res, next) => {
    const { key, id } = req.query;

    if (!key || key !== process.env.JWT_SECRET_KEY) return res.json('Invalid key');
    if (!id) return res.json('Missing id');

    return ManualTaskService.activatePlayer(id)
        .then(() => {
            const msg = 'Activated player';
            console.log(`[Manual] - ${msg}`);
            res.json(msg);
        })
        .catch(next);
});

/**
 * Extend a challenge
 * @param: key
 * @param: challengeId
 * @param: hours
 */
router.get('/extend', (req, res, next) => {
    const { key, id, hours } = req.query;

    if (!key || key !== process.env.JWT_SECRET_KEY) return res.json('Invalid key');
    if (!id) return res.json('Missing challengeId');
    if (!hours) return res.json('Missing hours');

    return ManualTaskService.extendChallenge(id, hours)
        .then(() => {
            const msg = 'Extended challenge';
            console.log(`[Manual] - ${msg}`);
            res.json(msg);
        })
        .catch(next);
});


module.exports = router;
