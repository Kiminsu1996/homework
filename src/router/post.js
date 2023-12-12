const postRouter = require('express').Router();
const {authenticateToken} = require('../middleware/authGuard.js');
const {pool} = require('../config/database/databases');
const {logMiddleware} = require('../module/logging');
const exception = require("../module/exception");
const { uploadFile, deleteFile } = require('../module/s3FileManager.js');
const upload = require('../middleware/upload.js');
const {maxTitle, maxText, minTitle, minText} = require('../module/lengths');

//게시글 작성
postRouter.post('/',authenticateToken, upload.array('files', 5), async (req, res, next) => {
    const { title, text } = req.body;
    const userIdx =  req.decode.idx;
    let conn = null;
    let fileUrls = [];

    const result = {
        "success" : false,
        "message" : null
    };
    
    try {
        exception(title, "title").checkInput().checkLength(minTitle, maxTitle);
        exception(text, "text").checkInput().checkLength(minText, maxText);
        
        //첨부 파일이 있으면 실행
        if (req.files) {  
            fileUrls = await Promise.all(req.files.map(file => uploadFile(file)));
        }
        // map은 동기함수이기 때문에 비동기 작업을 기다리지 않고 넘어가서 promis.all 함수를 사용해야한다.
        // promis.all => 비동기 작업을 병렬로 처리하고 작업이 끝날 때까지 기다리는 역할을 한다.

        if(!req.files){
            fileUrls = null;
        }

        conn = await pool.connect();

        //게시글 작성 
        const sql = "INSERT INTO backend.board (idx,title,content,urls) VALUES($1, $2, $3, $4)";
        const data = [userIdx, title, text, fileUrls.join(",")];
        await pool.query(sql, data);

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
postRouter.get('/all',  async (req, res, next) => {  
    let conn = null;

    const result = {
        "success" : false,
        "message" : null,
        "data" : null
    };

    try {
        conn = await pool.connect();

        //전체 게시글 보기 
        const searchAllPost = `SELECT backend.information.idx, backend.board.board_idx, backend.information.id, backend.board.title, backend.board.urls
                                FROM backend.information 
                                INNER JOIN backend.board ON backend.information.idx = backend.board.idx `;
        const allPost = await pool.query(searchAllPost);
        const row = allPost.rows

        if( row.length < 1 ){
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
postRouter.put('/', authenticateToken, upload.array('files', 5), async (req, res, next) => {
    const{ board_idx, title, text } = req.body;
    const userIdx =  req.decode.idx;
    let conn = null;
    let newFileUrls = [];
    let existingUrls = [];

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
        
        //기존에 저장된 file이 있는지 찾기 
        const checkExistingFile = "SELECT urls FROM backend.board WHERE board_idx = $1";
        const checkExistingFileResult = await pool.query(checkExistingFile, [board_idx]);
        existingUrls = checkExistingFileResult.rows[0].urls ? checkExistingFileResult.rows[0].urls.split(",") : null;  
        
        if (req.files) {  
            newFileUrls = await Promise.all(req.files.map(file => uploadFile(file)));
            existingUrls = [...existingUrls, ...newFileUrls];
        }

        if(!req.files){
            newFileUrls = null;
        }

        //게시판 수정
        conn = await pool.connect();
        const updatePost = "UPDATE backend.board SET title = $1 , content = $2, urls = $3 WHERE board_idx = $4 AND idx = $5";
        const updatePostResult = await pool.query(updatePost, [title, text, existingUrls.join(","), board_idx, userIdx]);
        
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

        //게시글에 저장된 파일 찾기
        const checkExistingFile = "SELECT urls FROM backend.board WHERE board_idx = $1";
        const checkExistingFileResult = await pool.query(checkExistingFile, [board_idx]);
        const urls = checkExistingFileResult.rows[0].urls ? checkExistingFileResult.rows[0].urls.split(",") : [];  
       
        //S3에서 파일 삭제 
        const files = urls.map(url => deleteFile(url));
        await Promise.all(files);
        
        //게시글 삭제
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

