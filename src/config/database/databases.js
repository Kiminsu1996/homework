const { Pool } = require("pg");
const { MongoClient } = require('mongodb');

const db = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port : process.env.DB_PORT
};

const url = 'mongodb://0.0.0.0:27017';

const pool = new Pool(db);
const client = new MongoClient(url);   //몽고DB는 기본적으로 Pool 방법이다.

module.exports = {
    pool,
    client
}