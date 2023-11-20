const { Pool } = require("pg");
const { MongoClient } = require('mongodb');

const db = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port : process.env.DB_PORT
};

const url = 'mongodb://localhost:27017';

const pool = new Pool(db);
const client = new MongoClient(url);

module.exports = {
    pool,
    client
}