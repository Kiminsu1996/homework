const userRouter = require('express').Router();
const pool = require('../database');


// 회원가입
userRouter.post('/', async  (req, res) => {
    
    const {id, password, name, phonenumber, email, address } = req.body;
    let conn = null;

    const result = {
        "success" : false,
        "message" : ""
    };

    try {
        
        // 빈 값 체크
        if (!id || !password || !name || !phonenumber || !email || !address || 
            id === "" || password === "" || name === "" || phonenumber === "" || 
            email === "" || address === "" ) {
                throw new Error(" 내용을 입력하세요. ");
            }
            
        // 길이 체크 
        if (id.length < 4 || password.length < 4) {
            throw new Error("최소 5글자 이상 입력해야 합니다.");
        }
        
        if (name.length < 1) {
            throw new Error("최소 2글자 이상 입력해야 합니다.");
        }
        
        if (phonenumber.length < 9 || address.length < 9) {
            throw new Error("최소 10글자 이상 입력해야 합니다.");
        }
        
        if (email.length < 5) {
            throw new Error("최소 6글자 이상 입력해야 합니다.");
        }
        
        if (id.length > 20 || password.length > 20 || name.length > 20 || phonenumber.length > 20) {
            throw new Error("최대 20글자 입니다.");
        }
        
        if (email.length > 30 || address.length > 30) {
            throw new Error("최대 30글자 입니다.");
        }
        //핸드폰 번호 형식 체크
        if (!/^\d{3}-\d{4}-\d{4}$/.test(phonenumber)) {
            throw new Error(" 올바른 핸드폰 번호 형식이 아닙니다. (예: 010-1234-1234) ");
        }
        
        //이메일 형식 체크
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            throw new Error(" 올바른 이메일 주소 형식이 아닙니다. (예: test@test.com) ");
        }
            
         
        conn = await pool.getConnection();

        // 아이디 중복체크
        const checkId = "SELECT id FROM information WHERE id = ?";
        const [findSameId] = await pool.query(checkId, [id]);
        
        if(findSameId.length > 0){

            result.message = "중복된 아이디 입니다.";

        }
        
        //회원가입
        if(findSameId.length < 1){

            const sql = 'INSERT INTO information (id, password, name, phonenumber, email, address) VALUES(?,?,?,?,?,?)';
            const data = [id, password, name, phonenumber, email, address];
    
            await pool.query(sql,data);
    
            result.success = true;
            
        }
        
    
    } catch (error) {

        result.message = error.message ;

    }finally{

        if (conn){   // 여기에 if문을 넣은 이유는 위에 conn = await pool.getConnection(); << 이 코드에서 conn이 null 값으로 DB통신에서 문제가 생기면  if문을 통해서 오류를 확인하고  서버가 다운되지 않게 하기 위함이다.
            conn.release();
        }

        res.send(result);

    }

});

//로그인
userRouter.post('/login', async (req, res) => {

    const {id, password} = req.body;
    let conn = null;

    const result = {
        "success" : false,
        "message" : ""
    };

    
    try {
        
        //빈 값 체크 
        if( !id || !password || id === null || password === null){
            throw new Error(" 내용을 입력하세요. ");
        }
    
        //길이 체크
        if ( id.length < 4 || password.length < 4 ){
            throw new Error(" 최소 5글자 이상 입력해야 합니다. ");
        }
    
        if( id.length > 20 || password.length > 20 ){
            throw new Error(" 최대 20글자 입니다. ");
        }
        
        conn = await pool.getConnection();

        //로그인 쿼리문
        const sql = " SELECT * FROM information WHERE id = ? AND password = ? ";
        const data = [id, password];
        const [user] = await pool.query(sql, data);

        if(user.length < 1){

            result.message = " 회원 정보가 없습니다. ";

        }

        if(user.length > 0) {

            const userIdx = user[0].idx;
    
            req.session.idx = userIdx;
    
            const userInfo = "SELECT * FROM information WHERE idx = ?";
            await pool.query(userInfo, [userIdx]);
    
            result.success = true;
        
        }

    } catch (error) {

        result.message = error.message;
        
    }finally{

        if (conn){
            conn.release();
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
userRouter.get('/:idx', async (req, res) => { 
    
    const requestIdx  = req.params.idx; 
    let userIdx = req.session.idx
    let conn = null;

    const result = {
        "success" : false,
        "message" : "",
        "data" : null
    };
    
    try {
    
        if ( !userIdx || !requestIdx || userIdx === "" || requestIdx === "" ) {
            throw new Error(" 로그인 해주세요. ");
        }
        
        if( userIdx ){
            userIdx = userIdx.toString();
        }

        if ( userIdx !== requestIdx ){
            throw new Error(" 접근 권한이 없습니다. ");
        }
        
        conn = await pool.getConnection();
    
        const sql = "SELECT * FROM information WHERE idx = ?";
        const data = [userIdx];
        const [user] = await pool.query(sql, data);

        if(user.length > 0){

            result.success = true;
            result.data = user;

        }
        
    } catch (error) {

        result.message = error.message;

    }finally{

        if (conn){
            conn.release();
        }

        res.send(result);

    }

});


//아이디 찾기
userRouter.post('/find-id', async (req, res) => {
    
    const {name, phonenumber, email} = req.body;
    let conn = null;

    const result = {
        "success" : false,
        "message" : "",
        "data" : null
    };

    try {

        //빈 값 체크 
        if( !name || !phonenumber || !email || name === "" || phonenumber === "" || email === "" ){
            throw new Error(" 내용을 입력하세요. ");
        }
        
        //길이 체크 
        if ( name.length < 1 ){
            throw new Error(" 최소 2글자 이상 입력해야 합니다. ");
        }

        if( phonenumber.length < 9){
            throw new Error(" 최소 10글자 이상 입력해야 합니다. ");
        }

        if( email.length < 5 ){
            throw new Error(" 최소 6글자 이상 입력해야 합니다. ");
        }

        if( name.length > 20 || phonenumber.length > 20 ){
            throw new Error(" 최대 20글자 입니다. ");
        }

        if( email.length > 30 ){
            throw new Error(" 최대 30글자 입니다. ");
        }

        //핸드폰 번호 형식 체크
        if (!/^\d{3}-\d{4}-\d{4}$/.test(phonenumber)) {
            throw new Error(" 올바른 핸드폰 번호 형식이 아닙니다. (예: 010-1234-1234) ");
        }
        
        //이메일 형식 체크 
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            throw new Error(" 올바른 이메일 주소 형식이 아닙니다. (예: test@test.com) ");
        }

        conn = await pool.getConnection();
        
        const sql = "SELECT id FROM information WHERE name = ? AND phonenumber = ? AND email = ? ";
        const data = [name, phonenumber, email];
        const [userId] = await pool.query(sql, data);

        if (userId.length > 0) {

            result.success = true ;
            result.data = userId;

        }
        
    } catch (error) {

        result.message = error.message;

    }finally{

        if (conn){
            conn.release();
        }
        
        res.send(result);

    }

});


//비밀번호 찾기
userRouter.post('/find-pw', async (req, res) => {

    const {id, name, phonenumber, email} = req.body;
    let conn = null;

    const result = {
        "success" : false,
        "message" : "",
        "data" : null
    };

    
    try {
        // 빈 값 체크 
        if ( !id || !name || !phonenumber || !email || id === "" || name === "" || phonenumber === "" || email === ""){
            throw new Error(" 내용을 입력하세요. ");
        }
    
        // 길이 체크     
        if ( id.length < 4 ){
            throw new Error(" 최소 5글자 이상 입력해야 합니다. ");
        }
    
        if ( name.length < 1 ){
            throw new Error(" 최소 2글자 이상 입력해야 합니다. ");
        }
    
        if( phonenumber.length < 9){
            throw new Error(" 최소 10글자 이상 입력해야 합니다. ");
        }
    
        if( email.length < 5 ){
            throw new Error(" 최소 6글자 이상 입력해야 합니다. ");
        }
    
        if ( id.length > 20 ||  name.length > 20 || phonenumber.length > 20 ){
            throw new Error(" 최대 20글자 입니다. ");
        }
    
        if ( email.length > 30 ){
            throw new Error(" 최대 30글자 입니다. ");
        }
    
        //핸드폰 번호 형식 체크
        if (!/^\d{3}-\d{4}-\d{4}$/.test(phonenumber)) {
            throw new Error(" 올바른 핸드폰 번호 형식이 아닙니다. (예: 010-1234-1234) ");
        }
        
        //이메일 형식 체크 
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            throw new Error(" 올바른 이메일 주소 형식이 아닙니다. (예: test@test.com) ");
        }

        conn = await pool.getConnection();
    
        const sql = "SELECT password FROM information WHERE id = ? AND name = ? AND phonenumber = ? AND email = ? ";
        const data = [id, name, phonenumber, email];
        const [userPw] = await pool.query(sql, data);
    
        if(userPw.length > 0){

            result.success = true;
            result.data = userPw;
    
        }
    
    } catch (error) {

        result.message = error.message;
        
    } finally { 

        if (conn){
            conn.release();
        }

        res.send(result);
    }

});


//회원정보 수정
userRouter.put('/', async (req, res) => {

    const {id, password, name, phonenumber, email, address} = req.body;
    let userIdx = req.session.idx
    let conn = null;

    const result = {
        "success" : false,
        "message" : ""
    };

    try {

        if( !userIdx || userIdx === "" ){
            throw new Error(" 로그인이 필요합니다. ");
        }

        if( userIdx ){
            userIdx = userIdx.toString();
        }
    
        // 빈 값 체크 
        if ( !id || !password || !name || !phonenumber || !email || !address || 
            id === "" || password === "" || name === "" || phonenumber === "" || 
            email === "" || address === ""){
    
            throw new Error(" 내용을 입력하세요. ");
    
        }
    
        // 길이 체크 
        if ( id.length < 4 || password.length < 4 ){
            throw new Error(" 최소 5글자 이상 입력해야 합니다. ");
        }
    
        if ( name.length < 1 ){
            throw new Error(" 최소 2글자 이상 입력해야 합니다. ");
        }
    
        if( phonenumber.length < 9 || address.length < 9){
            throw new Error(" 최소 10글자 이상 입력해야 합니다. ");
        }
    
        if( email.length < 5 ){
            throw new Error(" 최소 6글자 이상 입력해야 합니다. ");
        }
    
        if ( id.length > 20 || password.length > 20 || name.length > 20 || phonenumber.length > 20 ){
            throw new Error(" 최대 20글자 입니다. ");
        }
    
        if ( email.length > 30 || address.length > 30 ){
            throw new Error(" 최대 30글자 입니다. ");
        }
    
        //핸드폰 번호 형식 체크
        if (!/^\d{3}-\d{4}-\d{4}$/.test(phonenumber)) {
            throw new Error(" 올바른 핸드폰 번호 형식이 아닙니다. (예: 010-1234-1234) ");
        }
        
        //이메일 형식 체크 
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            throw new Error(" 올바른 이메일 주소 형식이 아닙니다. (예: test@test.com) ");
        }
    
        conn = await pool.getConnection();

        //회원정보 수정
        const updateSql = 'UPDATE information SET id=?, password=?, name=?, phonenumber=?, email=?, address=? WHERE idx=?';
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
userRouter.delete('/', async (req, res) => {
    
    const userIdx = req.session.idx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : ""
    };

    try {

        if( !userIdx || userIdx === "" ){
           throw new Error(" 로그인 해주세요. ");
        }
    
        conn = await pool.getConnection();

        //나의 모든 게시물에 남이 쓴 모든 댓글 지우기
        const deleteMyBoardCmt = "DELETE FROM comment WHERE board_idx IN (SELECT board_idx FROM board WHERE idx =?)";
        await pool.query(deleteMyBoardCmt, [userIdx]);  
        
        //남의 게시물에 내가 쓴 모든 댓글 지우기
        const deleteOtherBoardCmt = "DELETE FROM comment WHERE idx=?";
        await pool.query(deleteOtherBoardCmt, [userIdx]);  
        
        //내가 쓴 게시판 지우기
        const deleteBoard = "DELETE FROM board WHERE idx=?";
        await pool.query(deleteBoard, [userIdx]);  
        
        //회원 탈퇴
        const deleteInfo = "DELETE FROM information WHERE idx=?";
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
            conn.release();
        }

        res.send(result);

    }

});

module.exports = userRouter;  // module.exports는 common js 모듈에서 사용된다. userRouter를 다른 파일에서 사용할 수 있도록 하는 역할  



