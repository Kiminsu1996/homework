const idRegex = /^[A-Za-z0-9]+$/;
const pwRegex = /^[A-Za-z0-9]+$/;
const nameRegex = /^[A-Za-z]+$/;
const phonenumberRegex = /^010-\d{4}-\d{4}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

module.exports = {  idRegex,
                    pwRegex,
                    nameRegex, 
                    phonenumberRegex, 
                    emailRegex
                }
