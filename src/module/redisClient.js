const redis = require("redis");

//client를 전역변수로 사용할 경우 이미 생성된 client가 있으면 그걸 재사용한다. 
//client를 전역변수로 사용할 수 있지만, 오류나 버그가 발생할 수 있는 가능성이 크다. 그렇기 때문에 지역변수로 사용하는게 좋다.
//client는 로그인 후에 만들어진다. 

const getRedisClient = () => {
    let client = null;
    client = redis.createClient();
    return client;
};

module.exports = getRedisClient;