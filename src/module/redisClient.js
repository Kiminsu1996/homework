const redis = require("redis");
let client = null;

const getRedisClient = () => {
    if (!client) {
        client = redis.createClient();
    }
    return client;
};

module.exports = getRedisClient;