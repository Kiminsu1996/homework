const logDataRouter = require('express').Router();
const moment = require('moment-timezone');
const { client } = require('../config/database/databases');


//logging 오름차순, 내림차순 조회
logDataRouter.get('/logs/:order', async (req, res, next) =>{
    let conn = null;

    try {
        conn = await client.connect();

        switch (req.params.order) {
            case 'asc':
                order = 1;
                break;
            case 'desc':
                order = -1;
                break;
            default:
                throw new Error(' 잘못된 입력 값 입니다.');
        }

        const logs = await conn.db("logging").collection("data").find({}).sort({"timestamp" : order}).toArray();

        if(logs.length < 1){
            throw new Error("등록된 데이터가 없습니다.");
        }

        res.send(logs);
    } catch (error) {
        return next(error);
    }finally {
        if (conn) {
            conn.close();
        }
    }
});


//특정 id 조회
logDataRouter.get('/id/:id', async (req, res, next) =>{
    let conn = null;

    try {
        conn = await client.connect();
        const id =  req.params.id;

        const logs = await conn.db("logging").collection("data").find({"inputData.id": id}).toArray();

        if(logs.length < 1){
            throw new Error("등록된 데이터가 없습니다.");
        }
        
        res.send(logs);
    } catch (error) {
        return next(error);
    }finally {
        if (conn) {
            conn.close();
        }
    }
});


//특정 api 조회
logDataRouter.get('/api/*', async (req, res, next) =>{ // *  < 뒤에 오는 어떤 경로도 매칭할 수 있다. << *로 하게되면 /로 들어오는게 모두 걸린다.....
    let conn = null;

    try {
        conn = await client.connect();
        const apiName = '/' + req.params[0];    //쿼리스트링으로 변경하자 

        const logs = await conn.db("logging").collection("data").find({"apiName": apiName}).toArray();

        if(logs.length < 1){
            throw new Error("등록된 데이터가 없습니다.");
        }

        res.send(logs);
    } catch (error) {
        return next(error);
    }finally {
        if (conn) {
            conn.close();
        }
    }
});


//일자 범위로 조회
logDataRouter.get('/date-range/:startDate/:endDate', async (req, res, next) => {
    let conn = null;

    try {
        conn = await client.connect();
        const startDate = moment.tz(req.params.startDate, 'Asia/Seoul').format();   // 쿼리스트링으로 변경하자 
        const endDate = moment.tz(req.params.endDate, 'Asia/Seoul').format();       // 쿼리 스트링으로 변경하자 

        const logs = await conn.db("logging").collection("data").find({"timestamp": {$gte: startDate, $lte: endDate}}).toArray();  // 연산자 다시 정리하기 

        // 날짜 입력할 때 예외처리 하기 

        if(logs.length < 1){
            throw new Error("등록된 데이터가 없습니다.");
        }

        res.send(logs);
    } catch (error) {
        return next(error);
    } finally {
        if (conn) {
            conn.close();
        }
    }
});


module.exports = logDataRouter;