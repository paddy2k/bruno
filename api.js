const dotenv = require("dotenv").config();
const mysqlClient = require("mysql");
const express = require("express");
const compression = require('compression');
const app = express();

let mysql = mysqlClient.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

mysql.connect(function(err) {
  if (err) throw err;
  console.log("Maria DB Connected!")
});

app
  .use(compression())
  .get("/api", (req, res) => {
    res.send("Hello World!") 
  })
  .get("/api/mowers", (req, res) => {
  	mysql.query("SELECT DISTINCT mower_id FROM mower_log ORDER BY mowerStatus ASC", function (error, results, fields) {
		const mowers = results.map((result) => result['mower_id']);
  		res.send(mowers);
  	})
  })
  .get("/api/mowers/:mowerId", (req, res) => {
  	const 
          mower_id = req.params.mowerId,
          past = new Date();
          past.setDate(past.getDate()-2);

        const dateQuery = `SELECT * FROM mower_log WHERE mower_id=${mysql.escape(mower_id)} AND dateTime BETWEEN '${formatDate(past)}' AND NOW()`;
        console.log("DateQuery:", dateQuery);
  	mysql.query(dateQuery, function (error, results, fields) {
                if(error){console.log(error);}
  		res.send(results);
  	})
  })
;

app.listen(process.env.SERVER_PORT, () => console.log(`Example app listening on port ${process.env.SERVER_PORT}!`));
