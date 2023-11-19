const userRouter = require('express').Router();
const { userIdx } = require('../middleware/authGuard');
const pool = require('../database/databases');

//유효성 검사 
const validateId = (req, res, next) => {
    const { id } = req.body;
    if (!id || !/^.{4,20}$/.test(id)) {
        return res.status(400).send({ success: false, message: " 내용을 적어주세요." });
    }
    next();
};

const validatePassword = (req, res, next) => {
    const { password } = req.body;
    if (!password || !/^.{4,20}$/.test(password)) {
        return res.status(400).send({ success: false, message: " 내용을 적어주세요." });
    }
    next();
};

const validateName = (req, res, next) => {
    const { name } = req.body;
    if (!name || !/^[a-zA-Z0-9]{2,20}$/.test(name)) {
        return res.status(400).send({ success: false, message: " 내용을 적어주세요." });
    }
    next();
};

const validatePhoneNumber = (req, res, next) => {
    const { phonenumber } = req.body;
    if(!phonenumber || !/^010-\d{4}-\d{4}$/.test(phonenumber)){
        return res.status(400).send({ success : false  , message: " 내용을 적어주세요." });
    }
    next();
}

const validateEmail = (req, res, next) => {
    const { email } = req.body;
    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) || email.length > 30 ) {
        return res.status(400).send({ success: false, message: " 내용을 적어주세요." });
    }
    next();
};

const validateAddress = (req, res, next) => {
    const { address } = req.body;
    if (!address || !/^.{10,30}$/.test(address)) {
        return res.status(400).send({ success: false, message: "내용을 적어주세요." });
    }
    next();
};

const validationMiddlewares = {
    signup : [validateId, validatePassword, validateName, validatePhoneNumber, validateEmail, validateAddress],
    changeUserInfo :  [validateId, validatePassword, validateName, validatePhoneNumber, validateEmail, validateAddress],
    login : [validateId, validatePassword],
    findId : [validateName, validatePhoneNumber, validateEmail],
    findPw : [validateId, validateName, validatePhoneNumber, validateEmail]
}

// try-catch-finally 중복코드 제거 함수  
// const dbConnection = async (dbConnectionCallback, req, res) => {
//     let conn = null;

//     try {
//         conn = await pool.connect();

//         await dbConnectionCallback(conn, req, res); // req와 res 객체를 전달
//     } catch (error) {
//         res.status(500).json({ success: false, message: "서버 에러" });
//     } finally {
//         if (conn) {
//             conn.end();
//         }
//     }
// };


// userRouter.post('/', validationMiddlewares.signup, async (req, res) => {
//     const { id, password, name, phonenumber, email, address } = req.body;

//     const result = {
//         success: false,
//         message: ""
//     };

//     dbConnection(async (conn, req, res) => {

//         // 아이디 중복 체크
//         const checkId = "SELECT id FROM backend.information WHERE id = $1";
//         const findSameId = await pool.query(checkId, [id]);

//         const row = findSameId.rows;

//         if (row.length > 0) {
//             return res.status(400).json({ success: false, message: "중복된 아이디 입니다." });
//         }

//         const sql = 'INSERT INTO backend.information (id, password, name, email, phonenumber, address) VALUES($1, $2, $3, $4, $5, $6)';
//         const data = [id, password, name, email, phonenumber, address];

//         await pool.query(sql, data);

//         result.success = true;
//         res.send(result);
//     }, req, res); // req와 res 객체를 전달
// });


// 회원가입
userRouter.post('/', validationMiddlewares.signup , async  (req, res, next) => {
    const {id, password, name, phonenumber, email, address } = req.body;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null
    };

    try {
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
        result.success = true;

    } catch (error) {
        return next(error);
    }finally{
        if (conn){   // 여기에 if문을 넣은 이유는 위에 conn = await pool.getConnection(); << 이 코드에서 conn이 null 값으로 DB통신에서 문제가 생기면  if문을 통해서 오류를 확인하고  서버가 다운되지 않게 하기 위함이다.
            conn.end();
        }
    }
    res.send(result);
    
});

//로그인
userRouter.post('/login', validationMiddlewares.login ,async (req, res, next) => {
    const {id, password} = req.body;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null
    };

    try {
        conn = await pool.connect();

        //로그인 쿼리문
        const sql = "SELECT * FROM backend.information WHERE id = $1 AND password = $2";
        const data = [id, password];
        const user = await pool.query(sql, data);
        const row = user.rows

        if(row.length < 1){
            throw new Error("회원 정보가 없습니다.")
        }

        const userIdx = row[0].idx;
        req.session.idx = userIdx;
        result.success = true;

    } catch (error) {
        return next(error);
    } finally {
        if (conn){
            conn.end(); 
        }
    }
    res.send(result);

});


//로그아웃
userRouter.post("/logout", async (req, res, next) => {

    const result = {
        "success" : false,
        "message" : null
    };

    try {
        req.session.destroy((error) => {
            if (error) {
                throw new Error("세션 제거 실패");
            }
        });

        result.success = true;

    } catch (error) {
        next(error);
    }

    res.send(result);
    

});


//회원정보 보기
userRouter.get('/', userIdx, async (req, res, next) => { 
    const userIdx =  req.userIdx;
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

        if(!row.length){
            throw new Error("회원 정보 보기 실패");
        }

        result.success = true;
        result.data = row;
        
    } catch (error) {
        return next(error);
    }finally{
        if (conn){
            conn.end();
        }
    }
    res.send(result);

});


//아이디 찾기
userRouter.post('/find-id', validationMiddlewares.findId, async (req, res, next) => {
    const {name, phonenumber, email} = req.body;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null,
        "data" : null
    };

    try {
        conn = await pool.connect();
        
        const sql = "SELECT id FROM backend.information WHERE name = $1 AND phonenumber = $2 AND email = $3";
        const data = [name, phonenumber, email];
        const userId = await pool.query(sql, data);
        const row = userId.rows

        if (row.length < 1) {
            throw new Error (" 아이디 찾기 실패 ");
        }

        result.success = true ;
        result.data = row;

    } catch (error) {
        return next(error);
    }finally{
        if (conn){
            conn.end();
        }
    }
    res.send(result);

});


//비밀번호 찾기
userRouter.post('/find-pw', validationMiddlewares.findPw, async (req, res, next) => {

    const {id, name, phonenumber, email} = req.body;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null,
        "data" : null
    };

    try {
        conn = await pool.connect();
    
        const sql = "SELECT password FROM backend.information WHERE id = $1 AND name = $2 AND phonenumber = $3 AND email = $4 ";
        const data = [id, name, phonenumber, email];
        const userPw = await pool.query(sql, data);
        const row = userPw.rows

        if(row.length < 1){
            throw new Error (" 비밀번호 찾기 실패 ");
        }
        result.success = true;
        result.data = row;

    } catch (error) {
        return next(error);
    } finally { 
        if (conn){
            conn.end();
        }
    }
    res.send(result);

});


//회원정보 수정
userRouter.put('/', validationMiddlewares.changeUserInfo, userIdx, async (req, res, next) => {
    const {id, password, name, phonenumber, email, address} = req.body;
    const userIdx =  req.userIdx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null
    };

    try {
        conn = await pool.connect();

        //회원정보 수정
        const updateSql = 'UPDATE backend.information SET id = $1, password = $2, name = $3, phonenumber = $4, email = $5, address = $6 WHERE idx = $7';
        const updateResult = await pool.query(updateSql, [id, password, name, phonenumber, email, address, userIdx]);

        if(updateResult.rowCount < 1){
            throw new Error(" 회원 정보 수정 실패 ");
        }

        result.success = true;
    } catch (error) {
        return next(error);
    }finally { 
        if (conn){
            conn.release();
        }
    }
    res.send(result);

});

//회원탈퇴
userRouter.delete('/', userIdx, async (req, res, next) => {
    const userIdx =  req.userIdx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null
    };

    try {
        conn = await pool.connect();

      
        const deleteUser = await pool.query("DELETE FROM backend.information WHERE idx = $1", [userIdx]);

        if(deleteUser.rowCount < 1){
            throw new Error(" 회원탈퇴 실패 "); 
        }

        req.session.destroy((error) => {
            if(error){
                throw new Error(" 세션 오류 발생 ");
            }
        });
        
        result.success = true;
    } catch (error) {
        return next(error);
    } finally { 
        if (conn){
            conn.end();
        }
    }
    res.send(result);

});

module.exports = userRouter;  // module.exports는 common js 모듈에서 사용된다. userRouter를 다른 파일에서 사용할 수 있도록 하는 역할  



