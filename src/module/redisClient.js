const redis = require("redis");
let client = null;

const getRedisClient = () => {
    if(client){
        console.log("연결유지중")
    }
    client = redis.createClient();
    return client;
};

module.exports = getRedisClient;