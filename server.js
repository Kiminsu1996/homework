require('dotenv').config();
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

 //라우팅 핸들러  페이지도 라우터로 뺀다.
app.get("/", (req, res) => { 
    res.sendFile(__dirname + '/public/html/index.html')
});


app.get("/login-page", (req, res) => {
    res.sendFile(__dirname + '/public/html/login.html')
});

app.get("/signup-page", (req, res) => {
    res.sendFile(__dirname + "/public/html/signup.html")
});


// 라우팅 설정
const userRouter = require("./router/user");
app.use('/user', userRouter);                             

const postRouter = require("./router/post");
app.use('/post', postRouter);

const commentRouter = require("./router/comment");
app.use('/comment', commentRouter);


// 404 
app.use((req, res) => {
    res.status(404).send("페이지를 찾을 수 없습니다.");
});


//웹서버 시작
app.listen(port, () =>{
    console.log(`${port}번에서 http 웹서버 실행`);
}) ;

