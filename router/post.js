const postRouter = require('express').Router();
const {board, userIdx} = require('../middleware/authGuard');
const pool = require('../database');



//게시글 작성
postRouter.post('/', board, userIdx, async (req, res) => {

    const { title, text } = req.body;
    const userIdx =  req.userIdx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : ""
    };

    try {
        conn = await pool.connect();

        //게시글 작성 
        if( userIdx ){

            const sql = "INSERT INTO backend.board (idx,title,content) VALUES($1, $2, $3)";
            const data = [userIdx, title, text];
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


//전체 게시글 보기
postRouter.get('/all', userIdx, async (req, res) => { 

    const userIdx =  req.userIdx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : "",
        "data" : null
    };

    
    try {
        conn = await pool.connect();

        if(userIdx){

            //전체 게시글 보기 
            const searchAllPost = ` SELECT backend.information.idx, backend.board.board_idx, backend.information.id, backend.board.title 
                                    FROM backend.information 
                                    INNER JOIN backend.board ON backend.information.idx = backend.board.idx ` ;
            const allPost = await pool.query(searchAllPost);
            const row = allPost.rows
    
            result.success = true;
            result.data = row;

        }
        
    } catch (error) {

        result.message = error.message;

    }finally{

        if(conn){
            conn.end();
        }

        res.send(result);

    }
   
});


//특정 게시글 보기
postRouter.get('/:board_idx', userIdx, async (req, res) => { 

    const boardIdx  = req.params.board_idx;
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

        //특정 게시글 보기 
        const searchUserPosts = " SELECT * FROM backend.board WHERE board_idx = $1";
        const userPosts = await pool.query(searchUserPosts, [boardIdx]);
        const row = userPosts.rows
    
        if( row.length > 0 ){
            
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


//게시글 수정 
postRouter.put('/', board, userIdx, async (req, res) => {

    const{ board_idx, title, text } = req.body;
    const userIdx =  req.userIdx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : ""
    };
    
    try {
        
        // 빈값체크 
        if( !board_idx || board_idx === "" ){
            throw new Error ( " 게시글을 찾을 수 없습니다. " );
        }
        
        conn = await pool.connect();

        
        //게시글 찾기
        const findPostQuery = "SELECT * FROM backend.board WHERE board_idx = $1 AND idx = $2";
        const foundPost = await pool.query(findPostQuery, [board_idx, userIdx]);
        const row = foundPost.rows
        
        if ( row.length === 0 ) {
            result.message = " 수정할 게시글을 찾을 수 없습니다. ";
        }

        //게시글 수정 
        if( row.length > 0 ){

            const updatePost = "UPDATE backend.board SET title = $1 , content = $2 WHERE board_idx = $3 AND idx = $4"; 
            await pool.query(updatePost, [title, text, board_idx, userIdx]);
    
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


//게시글 삭제
postRouter.delete('/',userIdx, async (req, res) =>{

    const {board_idx} = req.body;
    const userIdx =  req.userIdx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : ""
    };

    try {
        // 빈값체크 
        if( !board_idx || board_idx === "" ){
            throw new Error ( " 게시글을 찾을 수 없습니다. " );
        }

        conn = await pool.connect();

        //게시글 찾기
        const findPostQuery = "SELECT * FROM backend.board WHERE board_idx = $1 AND idx = $2 ";
        const foundPost = await pool.query(findPostQuery, [board_idx, userIdx]);
        const row = foundPost.rows
        
        if ( row.length === 0 ) {
            result.message = " 삭제할 게시글을 찾을 수 없습니다. ";
        }

       //게시글 삭제
       if( row.length > 0 ){

            const deleteComment = `DELETE FROM backend.comment WHERE board_idx = $1 `; 
            await pool.query(deleteComment, [board_idx]);

            
            const deletePost = `DELETE FROM backend.board WHERE board_idx = $1 AND idx = $2`; 
            await pool.query(deletePost, [board_idx, userIdx]);

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


module.exports = postRouter;

