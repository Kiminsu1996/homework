const postRouter = require('express').Router();
const {authenticateToken} = require("../middleware/authGuard.js");
const {pool} = require('../config/database/databases');
const {logMiddleware} = require('../module/logging');
const exception = require("../module/exception");
const {maxTitle, maxText, minTitle, minText} = require("../module/lengths");

//게시글 작성
postRouter.post('/',authenticateToken, async (req, res, next) => {
    const { title, text } = req.body;
    const userIdx =  req.decode.idx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null
    };

    try {
        exception(title, "title").checkInput().checkLength(minTitle, maxTitle);
        exception(text, "text").checkInput().checkLength(minText, maxText);

        conn = await pool.connect();

        //게시글 작성 
        const sql = "INSERT INTO backend.board (idx,title,content) VALUES($1, $2, $3)";
        const data = [userIdx, title, text];
        const makePost = await pool.query(sql, data);

        if(makePost.rowCount < 1){  // 이부분은 INSERT 가 안되면 DB에러가 발생하기 때문에 자동으로 catch로 가기 때문에 이렇게 예외처리 안해줘도 된다.
            throw new Error ("게시판 작성 실패");
        }

        result.success = true;
        req.outputData = result.success;

        logMiddleware(req, res);
        res.send(result);
    } catch (error) {
        return next(error);
    }finally{
        if (conn){
            conn.end();
        }
    }
});

//전체 게시글 보기
postRouter.get('/all',  async (req, res, next) => {  //여기도 로그인 체크는 미들웨어에서 하는걸로 했음
    let conn = null;

    const result = {
        "success" : false,
        "message" : null,
        "data" : null
    };

    try {
        conn = await pool.connect();

        //전체 게시글 보기 
        const searchAllPost = `SELECT backend.information.idx, backend.board.board_idx, backend.information.id, backend.board.title 
                                FROM backend.information 
                                INNER JOIN backend.board ON backend.information.idx = backend.board.idx `;
        const allPost = await pool.query(searchAllPost);
        const row = allPost.rows

        if(row.length < 1){
            throw new Error("게시글이 없습니다.");
        }

        result.success = true;
        result.data = row;
        req.outputData = result.success;

        await logMiddleware(req, res, next);
        res.send(result);
    } catch (error) {
        return next(error);
    }finally{
        if(conn){
            conn.end();
        }
    }
});

//특정 게시글 보기 
postRouter.get('/:board_idx', async (req, res, next) => { 
    const boardIdx  = req.params.board_idx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null,
        "data" : null
    };

    try {
        //게시판 체크
        if (!boardIdx) {
            throw new Error("해당 게시글이 없습니다.");
        }

        conn = await pool.connect();

        //특정 게시글 보기 
        const searchUserPosts = "SELECT * FROM backend.board WHERE board_idx = $1";
        const userPosts = await pool.query(searchUserPosts, [boardIdx]);
        const row = userPosts.rows;

        if( row.length > 0 ){
            result.success = true;
            result.data = row;
        }else{
            throw new Error("해당 게시글이 없습니다.");
        }
         
        req.outputData = result.data;

        await logMiddleware(req, res, next);
        res.send(result);
    } catch (error) {
        return next(error);
    } finally { 
        if (conn){
            conn.end();
        }
    }
});

//게시글 수정 
postRouter.put('/', authenticateToken, async (req, res, next) => {
    const{ board_idx, title, text } = req.body;
    const userIdx =  req.decode.idx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null
    };
    
    try {
        exception(title, "title").checkInput().checkLength(minTitle, maxTitle);
        exception(text, "text").checkInput().checkLength(minText, maxText);
        // 빈값체크 
        if( !board_idx || board_idx === "" ){
            throw new Error ("게시글을 찾을 수 없습니다.");
        }
        
        conn = await pool.connect();
        const updatePost = "UPDATE backend.board SET title = $1 , content = $2 WHERE board_idx = $3 AND idx = $4"; 
        const updatePostResult = await pool.query(updatePost, [title, text, board_idx, userIdx]);
        
        if(updatePostResult.rowCount < 1){
            throw new Error("게시글을 찾을 수 없습니다.");
        }
    
        result.success = true;
        req.outputData = result.success;

        await logMiddleware(req, res, next);
        res.send(result);
    } catch (error) {
        return next(error);
    } finally { 
        if (conn){
            conn.end();
        }
    }

});

//게시글 삭제
postRouter.delete('/',authenticateToken,  async (req, res, next) =>{
    const {board_idx} = req.body;
    const userIdx =  req.decode.idx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null
    };

    try {
        // 빈값체크 
        if( !board_idx || board_idx === "" ){
            throw new Error ("게시글을 찾을 수 없습니다.");
        }

        conn = await pool.connect();

        const deleteBoard = await pool.query(`DELETE FROM backend.board WHERE board_idx = $1 AND idx = $2`, [board_idx, userIdx]);

        if(deleteBoard.rowCount < 1){
            throw new Error ("삭제할 게시글이 없습니다.");
        }

        result.success = true;
        req.outputData = result.success;

        await logMiddleware(req, res, next);
        res.send(result);
    } catch (error) {
        return next(error);
    }finally{
        if (conn){
            conn.end();
        }
    }
});


module.exports = postRouter;

