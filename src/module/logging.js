const moment = require('moment-timezone');
const { client } = require('../config/database/databases');

const logMiddleware = async (req, res, next) => {
    let conn = null;

    try {
        conn = await client.connect();
        const accountIdx = req.decode && req.decode.idx ? req.decode.idx : 'undefined';

        const logData = {
            ip: req.ip,
            accountIdx: accountIdx,
            apiName: req.originalUrl,
            requestMethod: req.method,
            inputData: req.body,
            outputData: req.outputData,
            timestamp: moment().tz('Asia/Seoul').format(),
        };

        await conn.db('logging').collection('data').insertOne(logData);
    } catch (error) {
        return console.log(error);
    } finally {
        if (conn) {
            conn.close();
        }
    }
};

module.exports = { logMiddleware };
