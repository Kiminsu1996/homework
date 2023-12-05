// 토큰을 생성하는 모듈
const jwt = require("jsonwebtoken");
require('dotenv').config();

const createToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        issuer: process.env.JWT_ISSUER,
        expiresIn: process.env.JWT_EXPIRESIN
    });
};

const createManagerToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_MANAGER_SECRET, {
        issuer: process.env.JWT_MANAGER_ISSUER,
        expiresIn: process.env.JWT_MANAGER_EXPIRESIN
    });
};

const generateToken = (user, isManager = false) => { // 실제 토큰생성
    const payload = {
        idx: user.idx,
        id: user.id,
        pw: user.password,
        name: user.name,
        email: user.email,
        position: user.position
    };

    return isManager ? createManagerToken(payload) : createToken(payload);
};

module.exports = { createToken, createManagerToken, generateToken };