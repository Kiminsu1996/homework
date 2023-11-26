const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwtConfig");

const createToken = (user) => {
    return jwt.sign({
            idx: user.idx,
            id: user.id,
            pw: user.password,
            name: user.name,
            email: user.email
        },
        jwtConfig.secret,
        {
            issuer: jwtConfig.issuer,    
            expiresIn: jwtConfig.expiresIn
        }
    );
};

module.exports = {createToken};