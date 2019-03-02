let express = require('express');
let router = express.Router();
let AuthService = require('../services/AuthService');
let MailerService = require('../services/MailerService');

router.post('/password/reset/enable', function(req, res, next) {
   let playerId = req.body.playerId;

   console.log('Attempting to enable password reset.');
   AuthService.enablePasswordResetByPlayerId(playerId)
       .then(function(authorization) {
           return MailerService.resetPassword(authorization.getResetKey());
       })
       .then(function(email) {
           res.json({message: 'Recovery key has been sent to ' + AuthService.maskEmail(email)});
       })
       .catch(next);
});

router.post('/password/reset/change', function(req, res, next) {
    let password = req.body.password ? req.body.password.trim() : '';
    let resetKey = req.body.resetKey;

    console.log('Attempting to reset password.');
    AuthService.resetPasswordByResetKey(password, resetKey)
        .then(function() {
            res.json({message: 'Password has been successfully reset.'});
        })
        .catch(next);
});


/**
 * Gets information needed for login selection
 */
router.get('/logins', function(req, res, next) {
    AuthService.getLogins()
        .then(function(logins) {
            res.json({message: logins});
        })
        .catch(next);
});

module.exports = router;
