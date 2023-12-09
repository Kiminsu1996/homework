const moment = require('moment-timezone');

const loginCount = async (redis, pool) => {
    const today = moment().tz('Asia/Seoul').format('YYYY-MM-DD');

    try {
        if(moment().tz('Asia/Seoul').hour() === 0 && moment().tz('Asia/Seoul').minute() === 0){
            const loginCount = await redis.sCard(`loginUsers:${today}`);
            const insertTodayCountSql = "INSERT INTO backend.logins (date, counts) VALUES ($1, $2);";
            await pool.query(insertTodayCountSql, [today, loginCount]);
        }
    } catch (error) {
        console.log("error : ", error);
    } 
};

module.exports = {loginCount};
