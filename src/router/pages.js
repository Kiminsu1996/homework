const router = require("express").Router();
const path = require("path");

router.get("/", (req, res) => { 
    res.sendFile(path.join(__dirname + '/public/html/index.html'))
});

router.get("/login-page", (req, res) => {
    res.sendFile(path.join(__dirname + '/public/html/login.html'))
});

router.get("/signup-page", (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/signup.html"))
});

module.exports = router;