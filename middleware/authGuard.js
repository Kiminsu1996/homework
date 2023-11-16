//userIdx 유효성 검사 
const getUserIdx = (req, res, next) => {
    const userIdx = req.session.idx;
    if (!userIdx || userIdx === "") {
        return res.status(400).send({ success: false, message: "로그인 해주세요." });
    }
    req.userIdx = userIdx; // req 객체에 userIdx를 설정
    next();
};


//user 유효성 검사 
const validateId = (req, res, next) => {
    const { id } = req.body;
    if (!id || !/^.{4,20}$/.test(id)) {
        return res.status(400).send({ success: false, message: " 내용을 적어주세요. " });
    }
    next();
};

 

const validatePassword = (req, res, next) => {
    const { password } = req.body;
    if (!password || !/^.{4,20}$/.test(password)) {
        return res.status(400).send({ success: false, message: " 내용을 적어주세요. " });
    }
    next();
};


const validateName = (req, res, next) => {
    const { name } = req.body;
    if (!name || !/^[a-zA-Z0-9]{2,20}$/.test(name)) {
        return res.status(400).send({ success: false, message: " 내용을 적어주세요. " });
    }
    next();
};



const validatePhoneNumber = (req, res, next) => {
    const { phonenumber } = req.body;
    if(!phonenumber || !/^010-\d{4}-\d{4}$/.test(phonenumber)){
        return res.status(400).send({ success : false  , message: " 내용을 적어주세요. " });
    }
    next();
}



const validateEmail = (req, res, next) => {
    const { email } = req.body;
    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{6,30}$/.test(email)) {
        return res.status(400).send({ success: false, message: " 내용을 적어주세요. " });
    }

    next();
};



const validateAddress = (req, res, next) => {
    const { address } = req.body;
    if (!address || !/^.{10,30}$/.test(address)) {
        return res.status(400).send({ success: false, message: "내용을 적어주세요." });
    }
    next();
};



//post 유효성 검사 
const validateBoardTitle = (req, res, next) => {
    const { title } = req.body;
    if (!title || !/^.{5,30}$/.test(title)) {
        return res.status(400).send({ success: false, message: "내용을 적어주세요." });
    }
    next();
};


const validateBoardText = (req, res, next) => {
    const { text } = req.body;
    if (!text || !/^.{5,100}$/.test(text)) {
        return res.status(400).send({ success: false, message: "내용을 적어주세요." });
    }
    next();
};



//comment 유효성 검사 
const validateCommentText = (req, res, next) => {
    const { text } = req.body;
    if (!text || !/^.{5,100}$/.test(text)) {
        return res.status(400).send({ success: false, message: "내용을 적어주세요." });
    }
    next();
};


const signup = [validateId, validatePassword, validateName, validatePhoneNumber, validateEmail, validateAddress];
const changeUserInfo =  [validateId, validatePassword, validateName, validatePhoneNumber, validateEmail, validateAddress];
const login = [validateId, validatePassword];
const findId = [validateName, validatePhoneNumber, validateEmail];
const findPw = [validateId, validateName, validatePhoneNumber, validateEmail];
const board = [validateBoardTitle, validateBoardText ];
const comment = [validateCommentText];
const userIdx = [getUserIdx];

module.exports = {

    signup, changeUserInfo, login, findId, findPw, board, comment, userIdx

};



