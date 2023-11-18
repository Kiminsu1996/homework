require('dotenv').config(); //지우지말것...ㅠㅠ이걸 지워서 계속 오류발생했다 인수야 2시간 날렸다 이것때문에
const express = require("express"); //자바스크립트에서 다른 자바스크립트를 인폴트 할 수 있는 기능이 node에서 만들어졌음 node_module에 있는 express를 불러오는 것 
const session = require("express-session");
const app = express();  // express를 사용하기 위해 app이라는 변수에 express 모듈을 호출하는 것 이다.
const port = 7000;

//전역 미들웨어 설정
app.use(express.json());  //json을 해독하기 위한 설정 ,
app.use(express.static('public')); // 정적인 파일을 알려주는 코드 / 가상경로로 접근하는 방법이 있다.
app.use(session({

    secret : process.env.SESSION_SECRET,   //세션 데이터를 암호화하는데 사용되는 비밀키,  최소 16자 이상의 길이  // .env (환경변수)만드는 것 / .gitignoer << 이 파일안에 .env 파일을 넣어 놓으면 githup에 안올라간다.
    resave : false,                     // 세션 데이터 변경 여부와 관계없이 세션을 다시 저장하도록 설정하는 것
    saveUninitialized: false             // 초기화되지 않는 세션을 저장할지 여부를 나타내는 불리언 값 

}));


// 라우팅 설정
const pagesApi = require("./src/router/pages");
app.use('/', pagesApi);

const userRouter = require("./src/router/user");
app.use('/user', userRouter);                             

const postRouter = require("./src/router/post");
app.use('/post', postRouter);

const commentRouter = require("./src/router/comment");
app.use('/comment', commentRouter);


// // 404
// app.use((req, res) => {
//     res.status(404).send("페이지를 찾을 수 없습니다.");
// });

//서버애러 처리  > 쓰레기통 역할 
app.use((error, req, res, next) => {
    res.status(error.status).json({   //api를 받아 올 수 있다. 예외처리 중복코드, sql 문법오류 , DB서버 끊는거까지 가능하다 
        success: false,
        message: error.message
    });
});



//웹서버 시작
app.listen(port, () => {
    console.log(`${port}번에서 http 웹서버 실행`);
}) ;




// // 회원가입
// userRouter.post('/', validationMiddlewares.signup , async  (req, res, next) => {
    
//     const {id, password, name, phonenumber, email, address } = req.body;
//     let conn = null;

//     const result = {
//         "success" : false,
//         "message" : ""
//     };

//     try {

//         conn = await pool.connect();

//         // 아이디 중복체크
//         const checkId = "SELECT id FROM backend.information WHERE id = $1";
//         const findSameId = await pool.query(checkId, [id]);
        
//         const row = findSameId.rows

//         if(row.length > 0){
//             conn.end();
//             throw new Error("중복된 아이디 입니다.");

//         }
        
//         const sql = 'INSERT INTO backend.information (id, password, name, email, phonenumber, address) VALUES($1, $2, $3, $4, $5, $6)';
//         const data = [id, password, name, email, phonenumber, address];

//         await pool.query(sql,data);

//         result.success = true;
//         res.send(result);
//         conn.end();
//         next(error);
//     } 

// });