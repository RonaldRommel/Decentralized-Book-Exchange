const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "mysql",
  user: "root",
  password: "root",
  database: "bookdb",
  waitForConnections: true,
  connectionLimit: 10,
  port: 3306,
});

module.exports = db;
