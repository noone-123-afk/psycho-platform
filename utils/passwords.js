const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const PASSWORD_HASH_LENGTH = 64;

async function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const derivedKey = await scrypt(password, salt, PASSWORD_HASH_LENGTH);
    return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, passwordHash) {
    const [saltHex, hashHex, extra] = passwordHash.split(':');
    if (
        extra !== undefined ||
        !/^[a-f\d]{32}$/i.test(saltHex) ||
        !/^[a-f\d]{128}$/i.test(hashHex)
    ) {
        return false;
    }
    const expected = Buffer.from(hashHex, 'hex');
    const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), PASSWORD_HASH_LENGTH);
    return crypto.timingSafeEqual(actual, expected);
}

module.exports = { hashPassword, verifyPassword };
