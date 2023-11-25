const commentRouter = require('express').Router();
const {userIdx} = require('../middleware/authGuard');
const {pool} = require('../config/database/databases');
const {logMiddleware} = require('../module/logging');

const validateText = (req, res, next) => {
    const { text } = req.body;
    if (!text || !/^.{5,100}$/.test(text)) {
        return res.status(400).send({ success: false, message: "내용을 적어주세요." });
    }
    next();
};

const validationMiddlewares = {
    comment : [validateText]
}

//댓글 작성
commentRouter.post('/', validationMiddlewares.comment, userIdx, async (req, res, next) => {
    const {boardIdx, text} = req.body;
    const userIdx =  req.userIdx;
    let conn = null;
   
    const result = {
        "success" : false,
        "message" : null
    };

    try {
        if( !boardIdx || boardIdx === "" ){
            throw new Error ("게시판을 찾을 수 없습니다.");
        }

        conn = await pool.connect();

        //댓글 작성
        const sql = "INSERT INTO backend.comment (board_idx,idx,content) VALUES ($1, $2, $3)";
        const data = [boardIdx, userIdx, text];
        const makeComment = await pool.query(sql, data); 

        if(makeComment.rowCount < 1){
            throw new Error ("댓글 작성 실패");
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

//게시판 댓글 보기
commentRouter.get('/:board_idx', userIdx, async (req, res, next) => { 
    const boardIdx = req.params.board_idx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null,
        "data" : null
    };
    
    try {
        //게시판 체크
        if ( !boardIdx || boardIdx === "") {
            throw new Error("해당 게시글이 없습니다.");
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
        }else{
            throw new Error("해당 댓글이 없습니다.");
        }
        //성공인데 데이터가 안오는 경우가 있으니깐 그럴땐 메세지로 알려주기 
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

//댓글 수정
commentRouter.put('/', validationMiddlewares.comment, userIdx, async (req, res, next) => {
    const {boardIdx, commentIdx, text} = req.body
    const userIdx =  req.userIdx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null
    };

    try {
        if( !boardIdx || boardIdx === "" ){
            throw new Error ("게시판을 찾을 수 없습니다.");
        }

        if( !commentIdx || commentIdx === "" ){
            throw new Error ("댓글을 찾을 수 없습니다.");
        }
        
        conn = await pool.connect();

        // 댓글 찾기
        const updateSql = "UPDATE backend.comment SET content = $1 WHERE cmt_idx = $2 AND board_idx = $3 AND idx = $4 ";
        const updateComment = await pool.query(updateSql, [text, commentIdx, boardIdx, userIdx]);

        if(updateComment.rowCount < 1){
            throw new Error ("댓글을 찾을 수 없습니다.");
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

//댓글 삭제
commentRouter.delete('/', userIdx, async (req, res, next) => {
    const {commentIdx, boardIdx} = req.body;
    const userIdx =  req.userIdx;
    let conn = null;
    
    const result = {
        "success" : false,
        "message" : null
    };

    try {
        if( !boardIdx || boardIdx === "" ){
            throw new Error ("게시판을 찾을 수 없습니다.");
        }

        if( !commentIdx || commentIdx === "" ){
            throw new Error ("댓글을 찾을 수 없습니다.");
        }

        conn = await pool.connect();

        const deleteComment = "DELETE FROM backend.comment WHERE cmt_idx = $1 AND board_idx = $2 AND idx = $3 ";
        const deleteCommentResult = await pool.query(deleteComment, [commentIdx, boardIdx, userIdx]);

        if(deleteCommentResult.rowCount < 1){
            throw new Error ("삭제할 댓글이 없습니다.");
        }

        result.success = true;
        req.outputData = result.success;
        
        await logMiddleware(req, res, next);
        res.send(result);
    } catch (error) {
        return next(error);
    }finally {
        if (conn){
            conn.end();
        }
    }
});

module.exports = commentRouter;

