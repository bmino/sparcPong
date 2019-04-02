const EmailService = {

    verifyEmail(email) {
        console.log(`Verifying email of ${email}`);

        if (!email || email.length === 0) return Promise.reject(new Error('Email address must be provided'));

        if (email.length > 50) return Promise.reject(new Error('Email length cannot exceed 50 characters'));

        // Needs one @ symbol
        if ((email.match(/@/g) || []).length !== 1) return Promise.reject(new Error('Email must contain one @ symbol'));

        // Needs a period
        if ((email.match(/\./g) || []).length < 1) return Promise.reject(new Error('Email must contain at least one period'));

        // Cannot contain spaces
        if ((email.match(/\s+/g) || []).length > 0) return Promise.reject(new Error('Email cannot contain spaces'));

        return Promise.resolve(email);
    }

};


module.exports = EmailService;
