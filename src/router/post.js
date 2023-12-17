const postRouter = require('express').Router();
const {authenticateToken} = require('../middleware/authGuard.js');
const {pool} = require('../config/database/databases');
const {logMiddleware} = require('../module/logging');
const exception = require("../module/exception");
const { uploadFile, deleteFile } = require('../module/s3FileManager.js');
const uploadGuard = require('../middleware/uploadGuard.js');
const {maxTitle, maxText, minTitle, minText} = require('../module/lengths');

//게시글 작성
postRouter.post('/',authenticateToken, uploadGuard.array('files', 5), async (req, res, next) => {
    const { title, text } = req.body;
    const userIdx =  req.decode.idx;
    let conn = null;
    let fileUrls = [];

    const result = {
        "success" : false,
        "message" : null
    };
    
    try {
        exception(title, "title").checkInput().checkLength(minTitle, maxTitle); //이 예외처리도 미들웨어서 체크하는 방식으로 하는게 좋을 것 같다.
        exception(text, "text").checkInput().checkLength(minText, maxText);
                
        conn = await pool.connect();
        
        //게시글 작성 
        const insertBoardSql = "INSERT INTO backend.board (idx, title, content) VALUES ($1, $2, $3) RETURNING board_idx";
        const boardData = [userIdx, title, text];
        const boardResult = await pool.query(insertBoardSql, boardData);
        const boardIdx = boardResult.rows[0].board_idx; // 게시글의 idx를 가져옵니다.
        
        // 파일 정보를 upload 테이블에 저장
        if (req.files) {
            const uploadPromises = req.files.map(file => uploadFile(file));
            fileUrls = await Promise.all(uploadPromises);
        // map은 동기함수이기 때문에 비동기 작업을 기다리지 않고 넘어가서 promis.all 함수를 사용해야한다.
        // promis.all => 비동기 작업을 병렬로 처리하고 작업이 끝날 때까지 기다리는 역할을 한다.

            // 파일 정보를 upload 테이블에 저장
            fileUrls.forEach(async (fileUrl, index) => {
                const file = req.files[index];
                const fileType = file.mimetype.split('/')[1];
                const insertUploadSql = "INSERT INTO backend.upload (idx, type, urls) VALUES ($1, $2, $3)";
                const uploadData = [boardIdx, fileType, fileUrl];
                await pool.query(insertUploadSql, uploadData);
            });
        }

        if(!req.files){
            fileUrls = null;
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
        const searchAllPost = `
            SELECT 
            backend.information.idx, 
            backend.board.board_idx, 
            backend.information.id, 
            backend.board.title,
            string_agg(backend.upload.urls, ',') AS urls,
            string_agg(backend.upload.type, ',') AS types
        FROM 
            backend.information 
        INNER JOIN 
            backend.board ON backend.information.idx = backend.board.idx
        LEFT JOIN 
            backend.upload ON backend.board.board_idx = backend.upload.idx
        GROUP BY 
            backend.information.idx, backend.board.board_idx
        ORDER BY 
            backend.board.created_at DESC
    `;
        const allPost = await pool.query(searchAllPost);
        const row = allPost.rows

        if( row.length < 1 ){
            throw new Error("게시글이 없습니다.");
        }
        
        const uploadData = row.map(row => ({
            idx: row.idx,
            board_idx: row.board_idx,
            id: row.id,
            title: row.title,
            upload: row.urls ? row.urls.split(',').map((url, index) => {
                return {
                    order: index, 
                    url: url,
                    type: row.types.split(',')[index] 
                };
            }) : []
        }));

        result.success = true;
        result.data = uploadData;
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
        const searchUserPost = `
            SELECT 
                backend.board.idx, 
                backend.board.board_idx, 
                backend.board.title, 
                backend.board.content,
                COALESCE(string_agg(backend.upload.urls, ','), '') AS urls,
                COALESCE(string_agg(backend.upload.type, ','), '') AS type
            FROM 
                backend.board
            LEFT JOIN 
                backend.upload ON backend.board.board_idx = backend.upload.idx
            WHERE 
                backend.board.board_idx = $1
            GROUP BY 
                backend.board.idx, backend.board.board_idx, backend.board.title, backend.board.content
        `;
        const userPosts = await pool.query(searchUserPost, [boardIdx]);
        const row = userPosts.rows;
    
        if(!row.length){
            throw new Error("해당 게시글이 없습니다.");
        }

        const postData = row.map(row => ({
            idx: row.idx,
            board_idx: row.board_idx,
            title: row.title,
            content: row.content,
            upload: row.urls ? row.urls.split(',').map((url, index) => ({
                order: index,
                url: url,
                type: row.type.split(',')[index]
            })) : []
        }));

        result.success = true;
        result.data = postData;
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
postRouter.put('/', authenticateToken, uploadGuard.array('files', 5), async (req, res, next) => {
    const{ board_idx, title, text, deleteFiles } = req.body;
    const userIdx =  req.decode.idx;
    let conn = null;
    let existingUrls = [];

    const result = {
        "success" : false,
        "message" : null
    };
    
    try {
        exception(title, "title").checkInput().checkLength(minTitle, maxTitle);
        exception(text, "text").checkInput().checkLength(minText, maxText);

        // 빈값체크 
        if(!board_idx || board_idx === ""){
            throw new Error ("게시글을 찾을 수 없습니다.");
        }
        
        //게시판 수정
        conn = await pool.connect();
        const updatePost = "UPDATE backend.board SET title = $1 , content = $2 WHERE board_idx = $3 AND idx = $4";
        const updateResult = await pool.query(updatePost, [title, text, board_idx, userIdx]);
    
        if(!updateResult.rowCount){
            throw new Error("잘못된 게시글 입니다.");
        }

         //기존에 저장된 file이 있는지 찾기 
         const checkExistingFile = "SELECT urls FROM backend.upload WHERE idx = $1";
         const checkExistingFileResult = await pool.query(checkExistingFile, [board_idx]);
 
         if(checkExistingFileResult.rows.length){
             existingUrls = checkExistingFileResult.rows[0].urls.split(",");  
         }
         
         //s3에서 파일 삭제 및 DB에서 upload 된 파일 삭제 
         if(deleteFiles){
             const deleteS3File = deleteFiles.split(",");
             const deletePromises = deleteS3File.map(url => deleteFile(url));
             await Promise.all(deletePromises);
 
             const deleteDbUrls = deleteS3File.map(file => {
                 const fullUrl = `https://kiminsu1996.s3.ap-northeast-2.amazonaws.com/${file}`;
                 return pool.query(`DELETE FROM backend.upload WHERE urls = $1`, [fullUrl]);
             });
             await Promise.all(deleteDbUrls);
             existingUrls = existingUrls.filter(url => !deleteS3File.includes(url)); // existingUrls 변수에 삭제한 파일을 제외한 것들을 저장 
         }
        
        //새로운 파일 업로드 
        if (req.files) {
            const uploadPromises = req.files.map(async file => {
                const fileType = file.mimetype.split('/')[1];
                const fileUrl = await uploadFile(file);
                existingUrls.push(fileUrl);
                const insertUploadSql = "INSERT INTO backend.upload (idx, type, urls) VALUES ($1, $2, $3)";
                return pool.query(insertUploadSql, [board_idx, fileType, fileUrl]);
            });
            await Promise.all(uploadPromises);
        }

        if(!req.files){
            existingUrls = null;
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
        const checkFile = "SELECT urls FROM backend.upload WHERE idx = $1";
        const checkFileResult = await pool.query(checkFile, [board_idx]);
        const urls = checkFileResult.rows.map(row => row.urls);
        
        //게시글 삭제
        conn = await pool.connect();
        const deleteBoard = await pool.query(`DELETE FROM backend.board WHERE board_idx = $1 AND idx = $2`, [board_idx, userIdx]);
        
        if(!deleteBoard.rowCount){
            throw new Error ("삭제할 게시글이 없습니다.");
        }
        
        //S3에서 파일 삭제 
        const files = urls.map(url => deleteFile(url));
        await Promise.all(files);
        
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

