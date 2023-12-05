// 토큰을 디코딩(정제)하는 미들웨어
const jwt = require('jsonwebtoken');
const getRedisClient = require("../module/redisClient.js");
require('dotenv').config();


const authenticateToken = async (req, res, next) => {
    const token = req.headers.token;
    const redis = getRedisClient();

    try {
        if(!token) {
            throw new Error("no token");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const id = decoded.id;

        if (!redis.isOpen) {
            await redis.connect();
        }

        const redisToken = await redis.get(`userToken:${id}`);

        if (token !== redisToken) {
            await redis.del(`userToken:${id}`);
            throw new Error("중복 로그인 입니다. 로그아웃 합니다.");
        }

        req.decode = decoded;
        next();
    } catch (error) {
       return next(error);
    }
}

const authenticateManagerToken = async (req, res, next) => {
    const token = req.headers.token;
    const redis = getRedisClient();

    try {
        if(!token) {
            throw new Error("no token");
        }
        const decoded = jwt.verify(token, process.env.JWT_MANAGER_SECRET);  
        const id = decoded.id; 
        
        if (!redis.isOpen) {
            await redis.connect();
        }
        
        const redisToken = await redis.get(`userToken:${id}`);

        if (token !== redisToken) {
            await redis.del(`userToken:${id}`);
            throw new Error("중복 로그인 입니다. 로그아웃 합니다.");
        }

        req.decode = decoded;
        next();
    } catch (error) {
       return next(error);
    }
}

module.exports = {authenticateToken, authenticateManagerToken};

