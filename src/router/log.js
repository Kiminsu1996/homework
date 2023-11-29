const logDataRouter = require('express').Router();
const { client } = require('../config/database/databases');
const authenticateToken = require("../middleware/authGuard.js");
const exception = require("../module/exception");
const {maxIdLength, minIdLength} = require('../module/lengths');

//logging 오름차순, 내림차순 조회
logDataRouter.get('/logs/:order', authenticateToken, async (req, res, next) =>{
    let conn = null;
    const position = req.decode.position;

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

        if(position === "2"){
            const logs = await conn.db("logging").collection("data").find({}).sort({"timestamp" : order}).toArray();

            if(logs.length < 1){
                throw new Error("등록된 데이터가 없습니다.");
            }

            res.send(logs);
        }else{
            throw new Error("권한이 없습니다.");
        }

    } catch (error) {
        return next(error);
    } finally {
        if (conn) {
            conn.close();
        }
    }
});


//특정 id 조회
logDataRouter.get('/id/:id', authenticateToken, async (req, res, next) =>{
    let conn = null;
    const position = req.decode.position;
    const id =  req.params.id;

    try {
        exception(id, "id").checkInput().checkIdRegex().checkLength(minIdLength, maxIdLength);
        conn = await client.connect();
    
        if(position === "2"){
            const logs = await conn.db("logging").collection("data").find({"inputData.id": id}).toArray();

            if(logs.length < 1){
                throw new Error("등록된 데이터가 없습니다.");
            }

            res.send(logs);
        }else{
            throw new Error("권한이 없습니다.");
        }
        
    } catch (error) {
        return next(error);
    } finally {
        if (conn) {
            conn.close();
        }
    }
});


//특정 api 조회
logDataRouter.get('/api', authenticateToken, async (req, res, next) =>{ 
    let conn = null;
    const position = req.decode.position;
    const apiName = req.query.apiName; 

    try {
        exception(apiName, "apiName").checkInput()
        conn = await client.connect();
        
        if(position === "2"){
            const logs = await conn.db("logging").collection("data").find({"apiName": '/' + apiName}).toArray();
    
            if(logs.length < 1){
                throw new Error("등록된 데이터가 없습니다.");
            }

            res.send(logs);
        }else{
            throw new Error("권한이 없습니다.");
        }

    } catch (error) {
        return next(error);
    }finally {
        if (conn) {
            conn.close();
        }
    }
});


//일자 범위로 조회
logDataRouter.get('/date-range', authenticateToken, async (req, res, next) => {
    const {startDate, endDate} = req.query;
    let conn = null;
    const position = req.decode.position;

    try {
        exception(startDate, "startDate").checkInput().checkDate();
        exception(endDate, "endDate").checkInput().checkDate();
        conn = await client.connect();

        if(position === "2"){
            const logs = await conn.db("logging").collection("data").find({"timestamp": {$gte: startDate, $lte: endDate}}).toArray();
    
            if(logs.length < 1){
                throw new Error("등록된 데이터가 없습니다.");
            }

            res.send(logs);
        }else{
            throw new Error("권한이 없습니다.");
        }

    } catch (error) {
        return next(error);
    } finally {
        if (conn) {
            conn.close();
        }
    }
});


module.exports = logDataRouter;

//get 요청시 req.query 와 req.params 를 사용하는 상황 
//req.query 사용 : 필터링, 정렬 등의 목적으로 사용될 때 
//req.params 사용 : 특정 리소스나 항목을 식별하는 데 사용될 때 사용