const {idRegex, pwRegex, nameRegex, phonenumberRegex, emailRegex ,dateRegex} = require("../module/regex");
const errorMessage = {
    invalidRequest : "입력 값을 확인하세요.",
    length : "문자 길이를 확인하세요.",
    regex : "규칙을 지켜주세요.",
    isNumber : "숫자가 아닙니다."
}


function Excetpion(input, name){
    
    this.checkInput = () => {
        if(!input || input === ""){
            this.setError(errorMessage.invalidRequest);
        }
        return this;
    }

    this.checkLength = (min, max) => {
        if(input.length < min || input.length > max){
            this.setError(errorMessage.length);
        }
        return this;
    }

    this.checkIdRegex = () => {
        if(!idRegex.test(input)){
            this.setError(errorMessage.regex);
        }
        return this;
    }

    this.checkPwRegex = () => {
        if(!pwRegex.test(input)){
            this.setError(errorMessage.regex);
        }
        return this;
    }

    this.checkNameRegex = () => {
        if(!nameRegex.test(input)){
            this.setError(errorMessage.regex);
        }
        return this;
    }

    this.checkPhoneRegex = () => {
        if(!phonenumberRegex.test(input)){
            this.setError(errorMessage.regex);
        }
        return this;
    }

    this.checkEmailRegex = () => {
        if(!emailRegex.test(input)){
            this.setError(errorMessage.regex);
        }
        return this;
    }

    this.isNumber = () => {
        if(isNaN(Number(input))){
            this.setError(errorMessage.isNumber);
        }
        return this;
    }

    this.checkDate = () =>{
        if(!dateRegex.test(input)){
            this.setError(errorMessage.regex);
        }
        return this;
    }

    //위 함수들의 에러 처리 함수 
    this.setError = (message) => {
        const error = new Error(`${name} ${message}`);
        throw error;
    }
}

//생성자 함수로 사용하기 위해 새로운 객체 생성
const exception = (input, name) => {
    const res = new Excetpion(input, name);
    return res;
}

module.exports = exception;