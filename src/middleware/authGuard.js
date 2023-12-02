// 토큰을 디코딩(정제)하는 미들웨어
const jwt = require('jsonwebtoken');
require('dotenv').config();


const authenticateToken = (req, res, next) => {
    const token = req.headers.token;
    
    try {
        if(!token) {
            throw new Error("no token");
        }

        jwt.verify(token, process.env.JWT_SECRTET);
        const payload = token.split(".")[1];
        const convert = Buffer.from(payload, "base64");
        const data = JSON.parse(convert.toString());
        req.decode = data;        
        next();
        
    } catch (error) {
       return next(error);
    }
}

const authenticateManagerToken = (req, res, next) => {
    const token = req.headers.token;
    
    try {
        if(!token) {
            throw new Error("no token");
        }

        jwt.verify(token, process.env.JWT_MANAGER_SECRTET);
        const payload = token.split(".")[1];
        const convert = Buffer.from(payload, "base64");
        const data = JSON.parse(convert.toString());
        req.decode = data;        
        next();
        
    } catch (error) {
       return next(error);
    }
}

module.exports = {authenticateToken, authenticateManagerToken};

