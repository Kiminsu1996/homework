const postRouter = require('express').Router();
const {userIdx} = require('../middleware/authGuard');
const {pool} = require('../database/databases');
const {logMiddleware} = require('../logging/logging');

//유효성 검사 
const validateBoardTitle = (req, res, next) => {
    const { title } = req.body;
    if (!title || !/^.{5,30}$/.test(title)) {
        return res.status(400).send({ success: false, message: "내용을 적어주세요." });
    }
    next();
};

const validateText = (req, res, next) => {
    const { text } = req.body;
    if (!text || !/^.{5,100}$/.test(text)) {
        return res.status(400).send({ success: false, message: "내용을 적어주세요." });
    }
    next();
};

const validationMiddlewares = {
    board : [validateBoardTitle, validateText ]
}

//게시글 작성
postRouter.post('/', validationMiddlewares.board, userIdx, async (req, res, next) => {
    const { title, text } = req.body;
    const userIdx =  req.userIdx;
    let conn = null;

    const result = {
        "success" : false,
        "message" : null
    };

    try {
        conn = await pool.connect();

        //게시글 작성 
        const sql = "INSERT INTO backend.board (idx,title,content) VALUES($1, $2, $3)";
        const data = [userIdx, title, text];
        const makePost = await pool.query(sql, data);

        if(makePost.rowCount < 1){
            throw new Error ("게시판 작성 실패");
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

//전체 게시글 보기
postRouter.get('/all', userIdx, async (req, res, next) => {  //여기도 로그인 체크는 미들웨어에서 하는걸로 했음
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
            throw new Error("전체 게시글 보기 실패");
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

//특정 게시글 보기  / !!!!!!!!!!!!로그인 상태 체크하기!!!!!!!!!!!!!!  < 이부분은 미들웨어에서 체크함! userIdx
postRouter.get('/:board_idx', userIdx, async (req, res, next) => { 
    const boardIdx  = req.params.board_idx;
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

        //특정 게시글 보기 
        const searchUserPosts = " SELECT * FROM backend.board WHERE board_idx = $1";
        const userPosts = await pool.query(searchUserPosts, [boardIdx]);
        const row = userPosts.rows

        if( row.length > 0 ){
            result.success = true;
            result.data = row;
        }else{
            throw new Error("해당 게시글이 없습니다.");
        }
         
        //통신은 성공인데 결과가 실패인경우가 이런 경우이기 때문에 
        //게시글의 board_idx의 값이 없으면 없다고 메세지 보내기
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
postRouter.put('/', validationMiddlewares.board, userIdx, async (req, res, next) => {
    const{ board_idx, title, text } = req.body;
    const userIdx =  req.userIdx;
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
postRouter.delete('/',userIdx, async (req, res, next) =>{
    const {board_idx} = req.body;
    const userIdx =  req.userIdx;
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

