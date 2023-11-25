//userIdx 유효성 검사 
const getUserIdx = (req, res, next) => {

    const userIdx = req.session.idx;
    
    if (!userIdx || userIdx === "") {
        return res.status(400).send({ success: false, message: "로그인 해주세요." });
    }
    
    req.userIdx = userIdx; // req 객체에 userIdx를 설정

    next();

};

const userIdx = [getUserIdx];

module.exports = {userIdx};

