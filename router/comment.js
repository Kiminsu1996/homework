const commentRouter = require('express').Router();
const pool = require('../database');


//댓글 작성
commentRouter.post('/', async (req, res) => {
    const {boardIdx, text} = req.body;

    const userIdx =  req.session.idx;
    let conn = null;
   
    const result = {

        "success" : false,
        "message" : ""
        
    };

    try {

        if( !userIdx || userIdx === "" ){
            throw new Error ( " 로그인 해주세요." );
        }
        
        if( !boardIdx || boardIdx === "" ){
            throw new Error ( " 게시판을 찾을 수 없습니다. " );
        }

        if( !text || text === ""){
            throw new Error(" 내용을 입력하세요. ");
        }

        if( text.length > 100){
            throw new Error(" 최대 100글자 입니다. ");
        }

        if( text.length < 5){
            throw new Error(" 최소 5글자 입니다. ");
        }

        conn = await pool.getConnection();

        //게시판 찾기
        const checkBoardQuery = "SELECT board_idx FROM board WHERE board_idx = ?";
        const [boardResult] = await pool.query(checkBoardQuery, [boardIdx]);

        if (boardResult.length === 0) {
            result.message = "게시판을 찾을 수 없습니다.";
        }

        if(boardResult.length > 0){

            //댓글 작성
            const sql = "INSERT INTO comment (board_idx,idx,content) VALUES (?,?,?)";
            const data = [boardIdx, userIdx, text];
            await pool.query(sql, data); 

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


//게시판 댓글 보기
commentRouter.get('/:board_idx', async (req, res) => { 

    const userIdx =  req.session.idx;
    const boardIdx = req.params.board_idx;
    let conn = null;

    const result = {

        "success" : false,
        "message" : "",
        "data" : null
        
    };
    
    try {
        
        //로그인 체크
        if( !userIdx || userIdx === "" ){
            throw new Error(" 로그인 해주세요. ");
        }

        //게시판 체크
        if ( !boardIdx || boardIdx === "") {
            throw new Error( " 해당 게시글이 없습니다. " );
        }

        conn = await pool.getConnection();

        //게시판 댓글 보기 (id,내용)
        const sql = `SELECT information.id, comment.content
                     FROM comment
                     JOIN information ON information.idx = comment.idx
                     WHERE comment.board_idx = ?  `;

        const data = [boardIdx];
        const [comments] = await pool.query(sql, data);

        if(comments.length > 0){

            result.message = true;
            result.data = comments;

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


//댓글 수정
commentRouter.put('/', async (req, res) => {
    
    const {boardIdx, commentIdx, text} = req.body
    const userIdx =  req.session.idx;
    let conn = null;

    const result = {

        "success" : false,
        "message" : ""
        
    };

    try {
        
        if( !userIdx || userIdx === "" ){
            throw new Error ( " 로그인 해주세요." );
        }
    
        if( !boardIdx || boardIdx === "" ){
            throw new Error ( " 게시판을 찾을 수 없습니다. " );
        }

        if( !commentIdx || commentIdx === "" ){
            throw new Error ( " 댓글을 찾을 수 없습니다. " );
        }
        
        if( !text || text === ""){
            throw new Error(" 내용을 입력하세요. ");
        }
    
        if( text.length > 100){
            throw new Error(" 최대 100글자 입니다. ");
        }
    
        if( text.length < 5){
            throw new Error(" 최소 5글자 입니다. ");
        }
        
        conn = await pool.getConnection();

        // 댓글 찾기
        const sql = "SELECT * FROM comment WHERE cmt_idx = ? AND board_idx = ? AND idx = ?";
        const data = [commentIdx, boardIdx, userIdx];
        const [comment] = await pool.query(sql, data);

        if(comment.length === 0){

            result.message = " 댓글을 찾을 수 없습니다. ";
            
        }
        
        //댓글 업데이트
        if(comment.length > 0){
            
            const updateSql = "UPDATE comment SET content = ? WHERE cmt_idx = ? AND board_idx =? AND idx = ? ";
            await pool.query(updateSql, [text, commentIdx, boardIdx, userIdx]);
    
            result.success = true;

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


//댓글 삭제
commentRouter.delete('/', async (req, res) => {
    
    const {commentIdx, boardIdx} = req.body;
    const userIdx =  req.session.idx;
    let conn = null;
    
    const result = {
        "success" : false,
        "message" : ""
    };

    try {

        if( !userIdx || userIdx === "" ){
            throw new Error ( " 로그인 해주세요." );
        }
    
        if( !boardIdx || boardIdx === "" ){
            throw new Error ( " 게시판을 찾을 수 없습니다. " );
        }

        if( !commentIdx || commentIdx === "" ){
            throw new Error ( " 댓글을 찾을 수 없습니다. " );
        }

        
        conn = await pool.getConnection();

        //댓글찾기
        const sql = "SELECT * FROM comment WHERE cmt_idx = ? AND board_idx = ? AND idx = ?";
        const data = [commentIdx, boardIdx, userIdx];
        const [comment] = await pool.query(sql, data);

        if(comment.length === 0){

            result.message = " 댓글을 찾을 수 없습니다. ";
            
        }
        
        //댓글 삭제 
        if(comment.length > 0){
            
            const updateSql = "DELETE FROM comment WHERE cmt_idx = ? AND board_idx =? AND idx = ? ";
            await pool.query(updateSql, [commentIdx, boardIdx, userIdx]);
    
            result.success = true;

        }

    } catch (error) {
        
        result.message = error.message;

    }finally {

        if (conn){
            conn.release();
        }

        res.send(result);
    }

});


module.exports = commentRouter;

