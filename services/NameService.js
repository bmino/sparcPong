const NameService = {
    USERNAME_LENGTH_MIN: process.env.USERNAME_LENGTH_MIN || 2,
    USERNAME_LENGTH_MAX: process.env.USERNAME_LENGTH_MAX || 15,

    verifyRealName(firstName, lastName) {
        console.log(`Verifying real name of ${firstName} ${lastName}`);

        return new Promise(function(resolve, reject) {

            if (!firstName || !lastName) return reject(new Error('You must give a first and last name.'));

            // Can only be 15 characters long
            if (firstName.length > 15 || firstName.length < 1 || lastName.length > 15 || lastName.length < 1)
                return reject(new Error('First and last name must be between 1 and 15 characters.'));

            // No special characters
            if (!/^[A-Za-z0-9_ ]*$/.test(firstName) || !/^[A-Za-z0-9_ ]*$/.test(lastName)) return reject(new Error('First and last name can only include letters, numbers, underscores, and spaces.'));

            // Concurrent spaces
            if (/\s{2,}/.test(firstName) || /\s{2,}/.test(lastName)) return reject(new Error('First and last name cannot have concurrent spaces.'));

            // Concurrent underscores
            if (/_{2,}/.test(firstName) || /_{2,}/.test(lastName)) return reject(new Error('First and last name cannot have concurrent underscores.'));

            return resolve([firstName, lastName]);
        });
    },

    verifyUsername(username) {
        console.log(`Verifying username of ${username}`);

        return new Promise(function(resolve, reject) {

            if (!username) return reject(new Error('You must give a username.'));

            // Can only be 15 characters long
            if (username.length > NameService.USERNAME_LENGTH_MAX || username.length < NameService.USERNAME_LENGTH_MIN)
                return reject(new Error(`Username length must be between ${NameService.USERNAME_LENGTH_MIN} and ${NameService.USERNAME_LENGTH_MAX} characters.`));

            // No special characters
            if (!/^[A-Za-z0-9_ ]*$/.test(username)) return reject(new Error('Username can only include letters, numbers, underscores, and spaces.'));

            // Concurrent spaces
            if (/\s{2,}/.test(username)) return reject(new Error('Username cannot have concurrent spaces.'));

            // Concurrent underscores
            if (/_{2,}/.test(username)) return reject(new Error('Username cannot have concurrent underscores.'));

            return resolve(username);
        });
    }

};


module.exports = NameService;
