require('dotenv').config(); //지우지말것...ㅠㅠ이걸 지워서 계속 오류발생했다 인수야 2시간 날렸다 이것때문에
const express = require("express"); //자바스크립트에서 다른 자바스크립트를 인폴트 할 수 있는 기능이 node에서 만들어졌음 node_module에 있는 express를 불러오는 것 
const cookieParser  = require("cookie-parser");
const app = express();  // express를 사용하기 위해 app이라는 변수에 express 모듈을 호출하는 것 이다.
const port = 7000;

//전역 미들웨어 설정
app.use(express.json());  //json을 해독하기 위한 설정 

// 라우팅 설정
const pagesApi = require("./src/router/pages");
app.use('/', pagesApi);  

const userRouter = require("./src/router/user");
app.use('/user', userRouter);                             

const postRouter = require("./src/router/post");
app.use('/post', postRouter);

const commentRouter = require("./src/router/comment");
app.use('/comment', commentRouter);

const logDataRouter = require("./src/router/log");
app.use('/log', logDataRouter);


//서버애러 처리  > 쓰레기통 역할 
app.use((error, req, res, next) => {
    const statusCode = error.status || 500;
    res.status(statusCode).json({   //api를 받아 올 수 있다. 예외처리 중복코드, sql 문법오류 , DB서버 끊는거까지 가능하다 
        success: false,
        message: error.message
    });
});
  
app.listen(port, () => {
    console.log(`${port}번에서 http 웹서버 실행`);
}) ;



