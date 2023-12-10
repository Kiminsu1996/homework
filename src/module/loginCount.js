const moment = require('moment-timezone');
const cron = require('node-cron'); 
const { pool } = require('../config/database/databases');

const loginCount = async (redis) => {
    const now = moment().tz('Asia/Seoul');
    const today = now.format('YYYY-MM-DD');

    cron.schedule('0 59 23 * * *', async () => {
        try {
            const loginCount = await redis.sCard(`loginUsers:${today}`);
            const insertTodayCountSql = "INSERT INTO backend.logins (counts, date) VALUES ($1, $2)";
            await pool.query(insertTodayCountSql, [loginCount, today]);
        } catch (error) {
            console.log("error : ", error);
        }   
    });
};

module.exports = {loginCount};
