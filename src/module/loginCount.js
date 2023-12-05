const moment = require('moment-timezone');

const loginCount = async (redis, pool) => {
        const yesterday = moment().tz('Asia/Seoul').subtract(1, 'days').format('YYYY-MM-DD');
        const today = moment().tz('Asia/Seoul').format('YYYY-MM-DD');

        try {
            const getYesterdayCountSql = "SELECT counts FROM backend.logins WHERE date = $1";
            const yesterdayCountResult = await pool.query(getYesterdayCountSql, [yesterday]);
            const yesterdayCount = yesterdayCountResult.rows.length > 0 ? yesterdayCountResult.rows[0].counts : 0;
            const getTodayCountSql = "SELECT counts FROM backend.logins WHERE date = $1";
            const todayCountResult = await pool.query(getTodayCountSql, [today]);
            const loginCount = await redis.sCard(`loginUsers:${today}`);

            if (todayCountResult.rows.length === 0) {
                const upsertSql = `
                    INSERT INTO backend.logins (date, counts) 
                    VALUES ($1, $2)
                    ON CONFLICT (date)
                    DO UPDATE SET counts = backend.logins.counts + EXCLUDED.counts`;
                await pool.query(upsertSql, [today, yesterdayCount]);
            }else {
                const updateTodayCountSql = "UPDATE backend.logins SET counts = counts + $1 WHERE date = $2";
                await pool.query(updateTodayCountSql, [loginCount, today]);
            }

            //else 코드를 밑에처럼 바꿔주자 
            // if (moment().tz('Asia/Seoul').hour() === 0 && moment().tz('Asia/Seoul').minute() === 0) { << 이렇게 해줘야 한다 24:00를 기준으로 업데이트 해야하기 때문에 
            //     const upsertSql = `
            //     INSERT INTO backend.logins (date, counts) 
            //     VALUES ($1, $2)
            //     ON CONFLICT (date)
            //     DO UPDATE SET counts = EXCLUDED.counts`;
            //     await pool.query(upsertSql, [today, loginCount]);
            // }

        } catch (error) {
           console.log("error : ", error);
        } 
};

module.exports = {loginCount};
