const moment = require('moment-timezone');

const loginCron = async (redisClient, pool) => {
    const today = moment().tz('Asia/Seoul').format('YYYY-MM-DD');
    const loginCount = await redisClient.sCard(`loginUsers:${today}`);
    const upsertSql = `
    INSERT INTO backend.logins (date, counts) 
    VALUES ($1, $2)
    ON CONFLICT (date)
    DO UPDATE SET counts = backend.logins.counts + EXCLUDED.counts`;

    await pool.query(upsertSql, [today, loginCount]);
};

module.exports = loginCron;

