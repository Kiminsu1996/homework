const jwt = require('jsonwebtoken');
const jwtConfig = require("../config/jwtConfig");

const authenticateToken = (req, res, next) => {
    const token = req.headers.token;
    
    try {
        if(!token) {
            throw new Error("no token");
        }

        jwt.verify(token, jwtConfig.secret);
        const payload = token.split(".")[1];
        const convert = Buffer.from(payload, "base64");
        const data = JSON.parse(convert.toString());
        req.decode = data;
        
        next();

    } catch (error) {
       return next(error)
    }
}
module.exports = authenticateToken;

