require('dotenv').config();

module.exports = {
    secret : process.env.JWT_SECRTET,
    expiresIn : '2h',
    issuer: 'cono'
};