const searchRouter = require('express').Router();
const {authenticateToken} = require("../middleware/authGuard.js");
const getRedisClient = require("../module/redisClient.js");

//검색어 저장
searchRouter.post('/save-word', authenticateToken, async (req,res,next) => {
    const {searchWord} = req.body;
    const userId =  req.decode.id;
    const redis = getRedisClient();

    const result = {
        "success" : false,
    };

    try {
        if (!redis.isOpen) {
            await redis.connect();
        }
        const score = Date.now(); 
        await redis.zAdd(`searches:${userId}`, { score, value: searchWord });
        await redis.zRemRangeByRank(`searches:${userId}`, 0, -6);
        result.success = true;
        res.send(result);
    } catch (error) {
        return next(error);
    } finally{
        redis.disconnect();
    }

});


//최근 검색어 조회
searchRouter.get('/recent', authenticateToken, async (req, res, next) => {
    const userId = req.decode.id;
    const redis = getRedisClient();

    const result = {
        "success": false,
        "data": null
    };

    try {
        if (!redis.isOpen) {
            await redis.connect();
        }
        const recentWords = await redis.zRange(`searches:${userId}`, 0, 4, { REV: true });
        result.success = true;
        result.data = recentWords;
        res.send(result);
    } catch (error) {
        return next(error);
    } finally {
        await redis.disconnect();
    }
});

module.exports = searchRouter;