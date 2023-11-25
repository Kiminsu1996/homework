const moment = require('moment-timezone');
const { client } = require("../config/database/databases");

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
        return console.log(error); // 이런식으로 오류를 서버에서 보여주는게 맞다... 어차피 로그 관련된 내용이기 때문에 고객에게 보여줄 필요가 없다.
        // 리눅스 root안에 log 폴더가 있는데 거기 안에 애러 메세지가 저장된다.
    } finally {
        if (conn) {
            conn.close();
        }
    }
};

module.exports = {logMiddleware};