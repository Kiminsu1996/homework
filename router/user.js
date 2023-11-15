const userRouter = require('express').Router();
const {signup, changeUserInfo, login, findId, findPw, userIdx } = require('../middleware/authGuard');
const pool = require('../database');


// 회원가입
userRouter.post('/', signup , async  (req, res) => {
    
    const {id, password, name, phonenumber, email, address } = req.body;
    let conn = null;

    const result = {
        "success" : false,
        "message" : ""
    };

    try {

        conn = await pool.connect();

        // 아이디 중복체크
        const checkId = "SELECT id FROM backend.information WHERE id = $1";
        const findSameId = await pool.query(checkId, [id]);
        
        const row = findSameId.rows

        if(row.length > 0){

            result.message = "중복된 아이디 입니다.";

        }
        
        //회원가입
        if(row.length < 1){

            const sql = 'INSERT INTO backend.information (id, password, name, email, phonenumber, address) VALUES($1, $2, $3, $4, $5, $6)';
            const data = [id, password, name, email, phonenumber, address];
    
            await pool.query(sql,data);
    
            result.success = true;
            
        }
        
    
    } catch (error) {

        result.message = error.message;

    }finally{

        if (conn){   // 여기에 if문을 넣은 이유는 위에 conn = await pool.getConnection(); << 이 코드에서 conn이 null 값으로 DB통신에서 문제가 생기면  if문을 통해서 오류를 확인하고  서버가 다운되지 않게 하기 위함이다.
            conn.end();
        }

        res.send(result);

    }

});

//로그인
userRouter.post('/login', login, async (req, res) => {

    const {id, password} = req.body;
    let conn = null;

    const result = {
        "success" : false,
        "message" : ""
    };

    
    try {
        
        conn = await pool.connect();

        //로그인 쿼리문
        const sql = " SELECT * FROM backend.information WHERE id = $1 AND password = $2 ";
        const data = [id, password];
        const user = await pool.query(sql, data);
        const row = user.rows

        if(row.length < 1){

            result.message = " 회원 정보가 없습니다. ";

        }

        if(row.length > 0) {

            const userIdx = row[0].idx;
    
            req.session.idx = userIdx;
    
            const userInfo = "SELECT * FROM backend.information WHERE idx = $1";
            await pool.query(userInfo, [userIdx]);
    
            result.success = true;
        
        }

    } catch (error) {

        result.message = error.message;
        
    }finally{

        if (conn){
            conn.end();
        }

        res.send(result);

    }

    
});


//로그아웃
userRouter.post("/logout", async (req, res) => {

    const result = {
        "success" : false,
        "message" : ""
    };

    try {
        
        req.session.destroy((error) => {

            if (error) {
                throw new Error("세션 제거 실패");
            }
        });

        result.success = true;

    } catch (error) {

        result.message = error.message;
        
    }finally{

        res.send(result);

    }

});

//회원정보 보기
userRouter.get('/',userIdx, async (req, res) => { 
    
    const userIdx =  req.userIdx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : "",
        "data" : null
    };
    
    try {
    
        conn = await pool.connect();
    
        const sql = "SELECT * FROM backend.information WHERE idx = $1";
        const data = [userIdx];
        const user = await pool.query(sql, data);
        const row = user.rows

        if(row.length > 0){

            result.success = true;
            result.data = row;

        }
        
    } catch (error) {

        result.message = error.message;

    }finally{

        if (conn){
            conn.end();
        }

        res.send(result);

    }

});


//아이디 찾기
userRouter.post('/find-id', findId, async (req, res) => {
    
    const {name, phonenumber, email} = req.body;
    let conn = null;

    const result = {
        "success" : false,
        "message" : "",
        "data" : null
    };

    try {

        conn = await pool.connect();
        
        const sql = "SELECT id FROM backend.information WHERE name = $1 AND phonenumber = $2 AND email = $3 ";
        const data = [name, phonenumber, email];
        const userId = await pool.query(sql, data);
        const row = userId.rows

        if (row.length > 0) {

            result.success = true ;
            result.data = row;

        }
        
    } catch (error) {

        result.message = error.message;

    }finally{

        if (conn){
            conn.end();
        }
        
        res.send(result);

    }

});


//비밀번호 찾기
userRouter.post('/find-pw', findPw, async (req, res) => {

    const {id, name, phonenumber, email} = req.body;
    let conn = null;

    const result = {
        "success" : false,
        "message" : "",
        "data" : null
    };

    
    try {
        conn = await pool.connect();
    
        const sql = "SELECT password FROM backend.information WHERE id = $1 AND name = $2 AND phonenumber = $3 AND email = $4 ";
        const data = [id, name, phonenumber, email];
        const userPw = await pool.query(sql, data);
        const row = userPw.rows

        if(row.length > 0){

            result.success = true;
            result.data = row;
    
        }
    
    } catch (error) {

        result.message = error.message;
        
    } finally { 

        if (conn){
            conn.end();
        }

        res.send(result);
    }

});


//회원정보 수정
userRouter.put('/',changeUserInfo,userIdx, async (req, res) => {

    const {id, password, name, phonenumber, email, address} = req.body;
    const userIdx =  req.userIdx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : ""
    };

    try {
        conn = await pool.connect();

        //회원정보 수정
        const updateSql = 'UPDATE backend.information SET id = $1, password = $2, name = $3, phonenumber = $4, email = $5, address = $6 WHERE idx = $7';
        await pool.query(updateSql, [id, password, name, phonenumber, email, address, userIdx]);

        result.success = true;
        result.message = " 회원 정보 수정 성공 ";

    } catch (error) {

        result.message = error.message;
        
    }finally { 

        if (conn){
            conn.release();
        }

        res.send(result);

    }

});

//회원탈퇴
userRouter.delete('/',userIdx, async (req, res) => {
    
    const userIdx =  req.userIdx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : ""
    };

    try {
        conn = await pool.connect();

        //나의 모든 게시물에 남이 쓴 모든 댓글 지우기
        const deleteMyBoardCmt = "DELETE FROM backend.comment WHERE board_idx IN (SELECT board_idx FROM backend.board WHERE idx = $1)";
        await pool.query(deleteMyBoardCmt, [userIdx]);  
        
        //남의 게시물에 내가 쓴 모든 댓글 지우기
        const deleteOtherBoardCmt = "DELETE FROM backend.comment WHERE idx = $1";
        await pool.query(deleteOtherBoardCmt, [userIdx]);  
        
        //내가 쓴 게시판 지우기
        const deleteBoard = "DELETE FROM backend.board WHERE idx = $1";
        await pool.query(deleteBoard, [userIdx]);  
        
        //회원 탈퇴
        const deleteInfo = "DELETE FROM backend.information WHERE idx = $1";
        await pool.query(deleteInfo, [userIdx]);  
        

        req.session.destroy((error) => {
        
            if(error){
                throw new Error(" 세션 오류 발생 ");
            }
        
        });
        
        result.success = true;

    } catch (error) {

        result.message = error.message;

    } finally { 

        if (conn){
            conn.end();
        }

        res.send(result);

    }

});

module.exports = userRouter;  // module.exports는 common js 모듈에서 사용된다. userRouter를 다른 파일에서 사용할 수 있도록 하는 역할  



