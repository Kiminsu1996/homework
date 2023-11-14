const commentRouter = require('express').Router();
const {comment, userIdx} = require('../middleware/authGuard');
const pool = require('../database');


//댓글 작성
commentRouter.post('/', comment, userIdx, async (req, res) => {
    const {boardIdx, text} = req.body;
    const userIdx =  req.userIdx;
    let conn = null;
   
    const result = {

        "success" : false,
        "message" : ""
        
    };

    try {

        if( !boardIdx || boardIdx === "" ){
            throw new Error ( " 게시판을 찾을 수 없습니다. " );
        }

        conn = await pool.connect();

        //게시판 찾기
        const checkBoardQuery = "SELECT board_idx FROM backend.board WHERE board_idx = $1";
        const boardResult = await pool.query(checkBoardQuery, [boardIdx]);
        const row = boardResult.rows

        if ( row.length === 0) {
            result.message = "게시판을 찾을 수 없습니다.";
        }

        if( row.length > 0){

            //댓글 작성
            const sql = "INSERT INTO backend.comment (board_idx,idx,content) VALUES ($1, $2, $3)";
            const data = [boardIdx, userIdx, text];
            await pool.query(sql, data); 

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


//게시판 댓글 보기
commentRouter.get('/:board_idx', userIdx, async (req, res) => { 

    const boardIdx = req.params.board_idx;
    let conn = null;

    const result = {

        "success" : false,
        "message" : "",
        "data" : null
        
    };
    
    try {
        //게시판 체크
        if ( !boardIdx || boardIdx === "") {
            throw new Error( " 해당 게시글이 없습니다. " );
        }

        conn = await pool.connect();

        //게시판 댓글 보기 (id,내용)
        const sql = `SELECT backend.comment.cmt_idx, backend.comment.board_idx, backend.information.id, backend.comment.content
                     FROM backend.comment
                     JOIN backend.information ON backend.information.idx = backend.comment.idx
                     WHERE backend.comment.board_idx = $1  `;

        const data = [boardIdx];
        const comments = await pool.query(sql, data);
        const row = comments.rows

        if( row.length > 0){

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


//댓글 수정
commentRouter.put('/', comment, userIdx, async (req, res) => {
    
    const {boardIdx, commentIdx, text} = req.body
    const userIdx =  req.userIdx;
    let conn = null;

    const result = {

        "success" : false,
        "message" : ""
        
    };

    try {
        if( !boardIdx || boardIdx === "" ){
            throw new Error ( " 게시판을 찾을 수 없습니다. " );
        }

        if( !commentIdx || commentIdx === "" ){
            throw new Error ( " 댓글을 찾을 수 없습니다. " );
        }
        
        conn = await pool.connect();

        // 댓글 찾기
        const sql = "SELECT * FROM backend.comment WHERE cmt_idx = $1 AND board_idx = $2 AND idx = $3";
        const data = [commentIdx, boardIdx, userIdx];
        const comment = await pool.query(sql, data);
        const row = comment.rows

        if( row.length === 0){

            result.message = " 댓글을 찾을 수 없습니다. ";
            
        }
        
        //댓글 업데이트
        if( row.length > 0){
            
            const updateSql = "UPDATE backend.comment SET content = $1 WHERE cmt_idx = $2 AND board_idx = $3 AND idx = $4 ";
            await pool.query(updateSql, [text, commentIdx, boardIdx, userIdx]);
    
            result.success = true;

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


//댓글 삭제
commentRouter.delete('/', userIdx, async (req, res) => {
    
    const {commentIdx, boardIdx} = req.body;
    const userIdx =  req.userIdx;
    let conn = null;
    
    const result = {
        "success" : false,
        "message" : ""
    };

    try {
        if( !boardIdx || boardIdx === "" ){
            throw new Error ( " 게시판을 찾을 수 없습니다. " );
        }

        if( !commentIdx || commentIdx === "" ){
            throw new Error ( " 댓글을 찾을 수 없습니다. " );
        }

        
        conn = await pool.connect();

        //댓글찾기
        const sql = "SELECT * FROM backend.comment WHERE cmt_idx = $1 AND board_idx = $2 AND idx = $3 ";
        const data = [commentIdx, boardIdx, userIdx];
        const comment = await pool.query(sql, data);
        const row = comment.rows

        if( row.length === 0){

            result.message = " 댓글을 찾을 수 없습니다. ";
            
        }
        
        //댓글 삭제 
        if( row.length > 0){
            
            const updateSql = "DELETE FROM backend.comment WHERE cmt_idx = $1 AND board_idx = $2 AND idx = $3 ";
            await pool.query(updateSql, [commentIdx, boardIdx, userIdx]);
    
            result.success = true;

        }

    } catch (error) {
        
        result.message = error.message;

    }finally {

        if (conn){
            conn.end();
        }

        res.send(result);
    }

});


module.exports = commentRouter;

