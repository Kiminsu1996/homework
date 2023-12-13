const moment = require('moment-timezone');
const cron = require('node-cron'); 
const { pool } = require('../config/database/databases');
const getRedisClient = require('../module/redisClient');

const loginCount = async () => {
    const now = moment().tz('Asia/Seoul');
    const today = now.format('YYYY-MM-DD');
    const redis = getRedisClient();
    
    cron.schedule('59 23 * * *', async () => {
        try {
            if (!redis.isOpen) {
                await redis.connect();
            }

            const loginCount = await redis.sCard(`loginUsers:${today}`);
            const insertTodayCountSql = "INSERT INTO backend.logins (counts, date) VALUES ($1, $2)";
            await pool.query(insertTodayCountSql, [loginCount, today]);
        } catch (error) {
            console.log("error : ", error);
        }   
    });
};

module.exports = { loginCount };
