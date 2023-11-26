const userRouter = require('express').Router();
const authModule = require("../module/auth");
const authenticateToken = require("../middleware/authGuard.js");
const {pool} = require('../config/database/databases');
const {logMiddleware} = require('../module/logging'); 
const exception = require("../module/exception");
const {
        maxIdLength, 
        maxPwLength, 
        maxNameLength, 
        maxPhonenumberLength, 
        maxEmailLength, 
        maxAddressLength,
        minIdLength,
        minPwLength,
        minNameLength,
        minPhonenumberLength,
        minEmailLength,
        minAddressLength } = require('../module/lengths');


// 회원가입
userRouter.post('/', async  (req, res, next) => {
    const {id, password, name, phonenumber, email, address } = req.body;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null
    };
    
    try {

        exception(id, "id").checkInput().checkIdRegex().checkLength(minIdLength, maxIdLength);
        exception(password, "password").checkInput().checkPwRegex().checkLength(minPwLength, maxPwLength);
        exception(name, "name").checkInput().checkNameRegex().checkLength(minNameLength, maxNameLength);
        exception(phonenumber, "phonenumber").checkInput().checkPhoneRegex().checkLength(minPhonenumberLength, maxPhonenumberLength);
        exception(email, "email").checkInput().checkEmailRegex().checkLength(minEmailLength, maxEmailLength);
        exception(address, "address").checkInput().checkLength(minAddressLength, maxAddressLength);

        conn = await pool.connect();

        // 아이디 중복체크
        const checkId = "SELECT id FROM backend.information WHERE id = $1";
        const findSameId = await pool.query(checkId, [id]);
        const row = findSameId.rows

        if(row.length > 0){
            throw new Error("중복된 아이디 입니다.")
        }
        
        const sql = 'INSERT INTO backend.information (id, password, name, email, phonenumber, address) VALUES($1, $2, $3, $4, $5, $6)';
        const data = [id, password, name, email, phonenumber, address];

        await pool.query(sql,data);
        req.outputData = result.success;
        result.success = true;

        logMiddleware(req, res, next);
        res.send(result);
    } catch (error) {
        return next(error);
    }finally{
        if (conn){   // 여기에 if문을 넣은 이유는 위에 conn = await pool.getConnection(); << 이 코드에서 conn이 null 값으로 DB통신에서 문제가 생기면  if문을 통해서 오류를 확인하고  서버가 다운되지 않게 하기 위함이다.
            conn.end();
        }
    }
});

//로그인
userRouter.post('/login', async (req, res, next) => {
    const {id, password} = req.body;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null,
        "data" :{
            "token" : null
        }
    };

    try {

        exception(id, "id").checkInput().checkIdRegex().checkLength(minIdLength, maxIdLength);
        exception(password, "password").checkInput().checkPwRegex().checkLength(minPwLength, maxPwLength);

        conn = await pool.connect();

        //로그인 쿼리문
        const sql = "SELECT * FROM backend.information WHERE id = $1 AND password = $2";
        const data = [id, password];
        const user = await pool.query(sql, data);
        const row = user.rows

        if(row.length < 1){
            throw new Error("회원 정보가 없습니다.")
        }

        const token = authModule.createToken({
            idx: row[0].idx,
            id: row[0].id,
            pw: row[0].password,
            name: row[0].name,
            email: row[0].email
        });

        result.data.token = token;
        result.success = true;
        req.outputData = result.success;

        logMiddleware(req, res, next);
        res.send(result);
    } catch (error) {
        return next(error);
    } finally {
        if (conn){
            conn.end(); 
        }
    }
});


//로그아웃
userRouter.post("/logout", async (req, res, next) => {
    res.clearCookie('token');
    res.json({success: true, massage: "로그아웃 되었습니다."})
});


//회원정보 보기
userRouter.get('/', authenticateToken, async (req, res, next) => { 
    const userIdx =  req.decode.idx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null,
        "data" : null
    };
    
    try {
        conn = await pool.connect();
        const sql = "SELECT * FROM backend.information WHERE idx = $1";
        const data = [userIdx];
        const user = await pool.query(sql, data);
        const row = user.rows

        if(row.length < 1){
            throw new Error("회원 정보 보기 실패");
        }

        result.success = true;
        result.data = row;
        req.outputData = result.data;

        logMiddleware(req, res, next);
        res.send(result);
    } catch (error) {
        return next(error);
    }finally{
        if (conn){
            conn.end();
        }
    }
});


//아이디 찾기
userRouter.post('/find-id',  async (req, res, next) => {
    const {name, phonenumber, email} = req.body;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null,
        "data" : null
    };

    try {

        exception(name, "name").checkInput().checkNameRegex().checkLength(minNameLength, maxNameLength);
        exception(phonenumber, "phonenumber").checkInput().checkPhoneRegex().checkLength(minPhonenumberLength, maxPhonenumberLength);
        exception(email, "email").checkInput().checkEmailRegex().checkLength(minEmailLength, maxEmailLength);

        conn = await pool.connect();
        
        const sql = "SELECT id FROM backend.information WHERE name = $1 AND phonenumber = $2 AND email = $3";
        const data = [name, phonenumber, email];
        const userId = await pool.query(sql, data);
        const row = userId.rows

        if (row.length < 1) {
            throw new Error ("아이디 찾기 실패");
        }

        result.success = true ;
        result.data = row;
        req.outputData = result.data;

        logMiddleware(req, res, next);
        res.send(result);
    } catch (error) {
        return next(error);
    }finally{
        if (conn){
            conn.end();
        }
    }
});


//비밀번호 찾기
userRouter.post('/find-pw',  async (req, res, next) => {

    const {id, name, phonenumber, email} = req.body;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null,
        "data" : null
    };

    try {
        exception(id, "id").checkInput().checkIdRegex().checkLength(minIdLength, maxIdLength);
        exception(name, "name").checkInput().checkNameRegex().checkLength(minNameLength, maxNameLength);
        exception(phonenumber, "phonenumber").checkInput().checkPhoneRegex().checkLength(minPhonenumberLength, maxPhonenumberLength);
        exception(email, "email").checkInput().checkEmailRegex().checkLength(minEmailLength, maxEmailLength);

        conn = await pool.connect();
    
        const sql = "SELECT password FROM backend.information WHERE id = $1 AND name = $2 AND phonenumber = $3 AND email = $4 ";
        const data = [id, name, phonenumber, email];
        const userPw = await pool.query(sql, data);
        const row = userPw.rows

        if(row.length < 1){
            throw new Error ("비밀번호 찾기 실패");
        }
        result.success = true;
        result.data = row;
        req.outputData = result.data;

        logMiddleware(req, res, next);
        res.send(result);
    } catch (error) {
        return next(error);
    } finally { 
        if (conn){
            conn.end();
        }
    }
});


//회원정보 수정
userRouter.put('/', authenticateToken, async (req, res, next) => {
    const {id, password, name, phonenumber, email, address} = req.body;
    const userIdx =  req.decode.idx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null
    };

    try {
        exception(id, "id").checkInput().checkIdRegex().checkLength(minIdLength, maxIdLength);
        exception(password, "password").checkInput().checkPwRegex().checkLength(minPwLength, maxPwLength);
        exception(name, "name").checkInput().checkNameRegex().checkLength(minNameLength, maxNameLength);
        exception(phonenumber, "phonenumber").checkInput().checkPhoneRegex().checkLength(minPhonenumberLength, maxPhonenumberLength);
        exception(email, "email").checkInput().checkEmailRegex().checkLength(minEmailLength, maxEmailLength);
        exception(address, "address").checkInput().checkLength(minAddressLength, maxAddressLength);

        conn = await pool.connect();

        //회원정보 수정
        const updateSql = 'UPDATE backend.information SET id = $1, password = $2, name = $3, phonenumber = $4, email = $5, address = $6 WHERE idx = $7';
        const updateResult = await pool.query(updateSql, [id, password, name, phonenumber, email, address, userIdx]);

        if(updateResult.rowCount < 1){
            throw new Error("회원 정보 수정 실패");
        }

        result.success = true;
        req.outputData = result.success;

        logMiddleware(req, res, next);
        res.send(result);
    } catch (error) {
        return next(error);
    }finally { 
        if (conn){
            conn.end();
        }
    }
});

//회원탈퇴
userRouter.delete('/', authenticateToken, async (req, res, next) => {
    const userIdx =  req.decode.idx;;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null
    };

    try {
        conn = await pool.connect();

        const deleteUser = await pool.query("DELETE FROM backend.information WHERE idx = $1", [userIdx]);

        if(deleteUser.rowCount < 1){
            throw new Error("회원탈퇴 실패"); 
        }

        result.success = true;
        result.message = "회원탈퇴 되었습니다. 쿠키를 삭제해주세요."
        req.outputData = result.success;

        logMiddleware(req, res, next);
        res.send(result);
    } catch (error) {
        return next(error);
    } finally { 
        if (conn){
            conn.end();
        }
    }
});

module.exports = userRouter;  // module.exports는 common js 모듈에서 사용된다. userRouter를 다른 파일에서 사용할 수 있도록 하는 역할  



