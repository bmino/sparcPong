const EmailService = {

    verifyEmail(email) {
        console.log(`Verifying email of ${email}`);

        return new Promise(function(resolve, reject) {
            if (!email) return reject(new Error('You must give an email.'));

            // Needs one @ symbol
            if ((email.match(/@/g) || []).length !== 1) return reject(new Error('Email must contain one @ symbol.'));

            // Needs a period
            if ((email.match(/\./g) || []).length < 1) return reject(new Error('Email must contain at least one period.'));

            // Cannot contain spaces
            if ((email.match(/\s+/g) || []).length > 0) return reject(new Error('Email cannot contain spaces.'));

            return resolve(email);
        });
    }

};


module.exports = EmailService;
