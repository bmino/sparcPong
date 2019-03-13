const express = require('express');
const router = express.Router();
const AuthService = require('../services/AuthService');
const MailerService = require('../services/MailerService');

router.post('/password/reset/enable', (req, res, next) => {
   let playerId = req.body.playerId;

   console.log('Attempting to enable password reset.');
   AuthService.enablePasswordResetByPlayerId(playerId)
       .then((authorization) => {
           return MailerService.resetPassword(authorization.getResetKey());
       })
       .then((email) => {
           res.json({message: `Recovery key has been sent to ${AuthService.maskEmail(email)}`});
       })
       .catch(next);
});

router.post('/password/reset/change', (req, res, next) => {
    let password = req.body.password ? req.body.password.trim() : '';
    let resetKey = req.body.resetKey;

    console.log('Attempting to reset password.');
    AuthService.resetPasswordByResetKey(password, resetKey)
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
