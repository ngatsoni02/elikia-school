const crypto = require('crypto');

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash.includes(':')) {
    return password === storedHash;
  }
  const [salt, hash] = storedHash.split(':');
  const computedHash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return hash === computedHash;
}

function isLegacyHash(storedHash) {
  return !storedHash.includes(':');
}

module.exports = { hashPassword, verifyPassword, isLegacyHash };
