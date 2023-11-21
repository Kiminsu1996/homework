const moment = require('moment-timezone');
const { client } = require("../database/databases");

const logMiddleware = async (req, res, next) => {
    let conn = null;

    try {
        conn = await client.connect();

        const logData = {
            'ip': req.ip,
            'accountIdx': req.session.idx,
            'apiName': req.originalUrl,
            'requestMethod': req.method,
            'inputData': req.body,
            'outputData': req.outputData,
            'timestamp': moment().tz('Asia/Seoul').format()
        };

        await conn.db("logging").collection("data").insertOne(logData);
    } catch (error) {
        return next(error);
    } finally {
        if (conn) {
            conn.close();
        }
    }
};

module.exports = {logMiddleware};