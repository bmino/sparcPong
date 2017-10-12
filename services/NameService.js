var NameService = {
    USERNAME_LENGTH_MIN: process.env.USERNAME_LENGTH_MIN || 2,
    USERNAME_LENGTH_MAX: process.env.USERNAME_LENGTH_MAX || 15,

    verifyRealName : verifyRealName,
    verifyUsername : verifyUsername

};

module.exports = NameService;


function verifyRealName(player) {
    console.log('Verifying real name of '+ player.firstName +' '+ player.lastName);

    return new Promise(function(resolve, reject) {

        if (!player.firstName || !player.lastName) return reject(new Error('You must give a first and last name.'));

        // Can only be 15 characters long
        if (player.firstName.length > 15 || player.firstName.length < 1 || player.lastName.length > 15 || player.lastName.length < 1)
            return reject(new Error('First and last name must be between '+ 1 +' and '+ 15 +' characters.'));

        // No special characters
        if (!/^[A-Za-z0-9_ ]*$/.test(player.firstName) || !/^[A-Za-z0-9_ ]*$/.test(player.lastName))
            return reject(new Error('First and last name can only include letters, numbers, underscores, and spaces.'));

        // Concurrent spaces
        if (/\s{2,}/.test(player.firstName) || /\s{2,}/.test(player.lastName))
            return reject(new Error('First and last name cannot have concurrent spaces.'));

        // Concurrent underscores
        if (/_{2,}/.test(player.firstName) || /_{2,}/.test(player.lastName))
            return reject(new Error('First and last name cannot have concurrent underscores.'));

        return resolve(player);
    });
}

function verifyUsername(username) {

    console.log('Verifying username of '+ username);

    return new Promise(function(resolve, reject) {

        if (!username) return reject(new Error('You must give a username.'));

        // Can only be 15 characters long
        if (username.length > NameService.USERNAME_LENGTH_MAX || username.length < NameService.USERNAME_LENGTH_MIN)
            return reject(new Error('Username length must be between ' + NameService.USERNAME_LENGTH_MIN + ' and ' + NameService.USERNAME_LENGTH_MAX + ' characters.'));

        // No special characters
        if (!/^[A-Za-z0-9_ ]*$/.test(username)) return reject(new Error('Username can only include letters, numbers, underscores, and spaces.'));

        // Concurrent spaces
        if (/\s{2,}/.test(username)) return reject(new Error('Username cannot have concurrent spaces.'));

        // Concurrent underscores
        if (/_{2,}/.test(username)) return reject(new Error('Username cannot have concurrent underscores.'));

        return resolve(username);

    });
}