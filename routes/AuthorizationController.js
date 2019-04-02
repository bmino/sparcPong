const express = require('express');
const router = express.Router();
const AuthService = require('../services/AuthService');
const MailerService = require('../services/MailerService');

router.post('/password/reset/enable', (req, res, next) => {
   const { playerId } = req.body;

   if (!playerId) return next(new Error('Player id is required'));

   AuthService.enablePasswordResetByPlayerId(playerId)
       .then((authorization) => MailerService.resetPassword(authorization.reset.key))
       .then((email) => {
           res.json({message: `Recovery key has been sent to ${AuthService.maskEmail(email)}`});
       })
       .catch(next);
});

router.post('/password/reset/change', (req, res, next) => {
    const { password, resetKey } = req.body;

    if (!password) return next(new Error('Password is required'));
    if (!resetKey) return next(new Error('Reset key is required'));

    AuthService.resetPasswordByResetKey(password.trim(), resetKey)
        .then(() => {
            res.json({message: 'Password has been successfully reset.'});
        })
        .catch(next);
});


/**
 * Gets information needed for login selection
 */
router.get('/logins', (req, res, next) => {
    AuthService.getLogins()
        .then((logins) => {
            res.json({message: logins});
        })
        .catch(next);
});

module.exports = router;
