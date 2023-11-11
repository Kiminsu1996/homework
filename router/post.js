const postRouter = require('express').Router();
const pool = require('../database');



//게시글 작성
postRouter.post('/', async (req, res) => {

    const { title, text } = req.body;
    const userIdx =  req.session.idx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : ""
    };

    try {
        
        //로그인 체크
        if( !userIdx || userIdx === "" ){
            throw new Error(" 로그인 해주세요. ");
        }
        
        //빈 값 체크
        if( !title || !text || title === "" || text === ""){
            throw new Error(" 내용을 입력하세요. ");
        }
    
        //길이 체크
        if (title.length < 4  || text.length < 4){
            throw new Error(" 최소 5글자 이상 입력해야 합니다. ");
        }
    
        if (title.length > 20  || text.length > 20){
            throw new Error(" 최대 20글자 입니다. ");
        }

        conn = await pool.getConnection();

        //게시글 작성 
        if( userIdx ){

            const sql = "INSERT INTO board (idx,title,content) VALUES(?,?,?)";
            const data = [userIdx, title, text];
            const [insertResult] = await pool.query(sql, data);

            req.session.board_idx = insertResult.insetId;

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


//전체 게시글 보기
postRouter.get('/all', async (req, res) => { 

    const userIdx =  req.session.idx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : "",
        "data" : null
    };

    
    try {
        
        //로그인 체크 
        if(!userIdx || userIdx === ""){
            throw new Error( " 로그인 해주세요. " );
        }

        conn = await pool.getConnection();

        //전체 게시글 보기 
        const searchAllPost = ` SELECT information.idx, board.board_idx, information.id, board.title 
                                FROM information 
                                INNER JOIN board ON information.idx = board.idx ` ;
        const [allPost] = await pool.query(searchAllPost);

        result.success = true;
        result.data = allPost;
        
    } catch (error) {

        result.message = error.message;

    }finally{

        if(conn){
            conn.release();
        }

        res.send(result);

    }
   
});


//특정 게시글 보기
postRouter.get('/:board_idx', async (req, res) => { 

    const userIdx =  req.session.idx
    const boardIdx  = req.params.board_idx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : "",
        "data" : null
    };

    try {
        
        //로그인 체크
        if( !userIdx || userIdx === "" ){
            throw new Error( " 로그인 해주세요. " );
        }
                     
        //게시판 체크
        if ( !boardIdx || boardIdx === "") {
            throw new Error( " 해당 게시글이 없습니다. " );
        }

        conn = await pool.getConnection();

        //특정 게시글 보기 
        const searchUserPosts = " SELECT * FROM board WHERE board_idx = ?";
        const [userPosts] = await pool.query(searchUserPosts, [boardIdx]);
        
    
        if( userPosts.length > 0 ){
            
            result.success = true;
            result.data = userPosts;
            
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


//게시글 수정 
postRouter.put('/', async (req, res) => {

    const{ board_idx, title, text } = req.body;
    const userIdx =  req.session.idx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : ""
    };
    
    try {
        
        //로그인 체크 
        if( !userIdx || userIdx === "" ){
            throw new Error ( " 로그인이 필요합니다. ");
        }

        // 빈값체크 
        if( !board_idx || board_idx === "" ){
            throw new Error ( " 게시글을 찾을 수 없습니다. " );
        }

        if ( !title || !text || title === "" || text === "" ){
            throw new Error ( " 내용을 입력하세요. " );
        }
    
        //길이 체크
        if ( title.length < 4  || text.length < 4 ){
            throw new Error ( " 최소 5글자 이상 입력해야 합니다. " );
        }
    
        if ( title.length > 20  || text.length > 20 ){
            throw new Error ( " 최대 20글자 입니다. " );
        }

        conn = await pool.getConnection();

        
        //게시글 찾기
        const findPostQuery = "SELECT * FROM board WHERE board_idx = ? AND idx = ?";
        const [foundPost] = await pool.query(findPostQuery, [board_idx, userIdx]);

        
        if ( foundPost.length === 0 ) {
            result.message = " 수정할 게시글을 찾을 수 없습니다. ";
        }

        //게시글 수정 
        if( foundPost.length > 0 ){

            const updatePost = "UPDATE board SET title = ? , content = ? WHERE board_idx = ? AND idx = ?"; 
            await pool.query(updatePost, [title, text, board_idx, userIdx]);
    
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


//게시글 삭제
postRouter.delete('/', async (req, res) =>{

    const {board_idx} = req.body;
    const userIdx = req.session.idx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : ""
    };

    try {
         //로그인 체크 
         if( !userIdx || userIdx === "" ){
            throw new Error ( " 로그인이 필요합니다. ");
        }

        // 빈값체크 
        if( !board_idx || board_idx === "" ){
            throw new Error ( " 게시글을 찾을 수 없습니다. " );
        }

        conn = await pool.getConnection();

        //게시글 찾기
        const findPostQuery = "SELECT * FROM board WHERE board_idx = ? AND idx = ?";
        const [foundPost] = await pool.query(findPostQuery, [board_idx, userIdx]);

        
        if ( foundPost.length === 0 ) {
            result.message = " 삭제할 게시글을 찾을 수 없습니다. ";
        }

       //게시글 삭제
       if( foundPost.length > 0 ){

            const deleteComment = `DELETE FROM comment WHERE board_idx = ?`; 
            await pool.query(deleteComment, [board_idx]);

            
            const deletePost = `DELETE FROM board WHERE board_idx = ? AND idx = ?`; 
            await pool.query(deletePost, [board_idx, userIdx]);

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


module.exports = postRouter;

