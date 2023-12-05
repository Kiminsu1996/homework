let loginTimeout = null;

const setLoginTimeout = (callback, timeout) => {
    //타이머 초기화
    if (loginTimeout) {
        clearTimeout(loginTimeout);
    }

    //타이머 설정
    loginTimeout = setTimeout(callback, timeout);
};

module.exports = {setLoginTimeout};
