const dotenv = require('dotenv').config();
const request = require('request');
const mysqlClient = require('mysql');
const mongoClient = require('mongodb').MongoClient;

const ident_api = "https://iam-api.dss.husqvarnagroup.net/api/v3/token";
const main_api = "https://amc-api.dss.husqvarnagroup.net/v1"

const interval = 30000;

let state = {};
let mysql = mysqlClient.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

let mongo = {};
let bruno = {};

function getToken(){
  request.post(ident_api, 
    { 
      json:true,
      body: {
        "data": {
          "attributes": {
            "username": process.env.HUSQUVARNA_USERNAME,
            "password": process.env.HUSQUVARNA_PASSWORD,
          },
          "type": "token"
        }
      }
    }, 
    function(err, res, body) {
      if (err) { return console.log(err); }
      state['token'] = body.data.id;
      state['provider'] = body.data.attributes.provider;
      // console.log("State:", state);
      getMowers();
    }
  )
}

function hqRequest(url, callback){
  request.get(
    {
      url: `${main_api}${url}`,
      json:true,
      headers: {
        "Authorization": `Bearer ${state['token']}`,
        "Authorization-Provider": state['provider'],
      }
    },
    callback
  )
}

function getMowers(){
  hqRequest("/mowers", function(err, res, body) {
    if (err) { return console.log(err); }
    state['mower_id'] = body[0].id;
    // console.log("getMowers", res);
    main();
  })
}

function getMowerStatus(callback){
  hqRequest(`/mowers/${state['mower_id']}/status`, function(err, res, body) {
    if (err) { return console.log(err); }
    callback(body);
  })
}

function init(){
  mysql.connect(function(err) {
    if (err) throw err;
    console.log("Maria DB Connected!");
    getToken();
  });
}

function main(){
  console.log("Main");
  setInterval(function(){
    getMowerStatus(function(body){
      // console.log("GET MOWER STATUS");

      let data = {
        "mower_id": state['mower_id'],
        "storedTimestamp": body.storedTimestamp,
        "batteryPercent": body.batteryPercent,
        "mowerStatus": body.mowerStatus,
        "operatingMode": body.operatingMode,
        "latitude": body.lastLocations[0].latitude,
        "longitude": body.lastLocations[0].longitude,
        "dateTime": new Date(body.storedTimestamp),
      };

      mysql.query('INSERT INTO mower_log SET ?', data, function (error, results, fields) {
        if (!error){
          console.log("Insert OK:", data.mowerStatus, '@', data.batteryPercent, data.storedTimestamp);
        }
        else {
          // console.error(error);
          console.log("Insert Duplicate:", data.mowerStatus, '@', data.batteryPercent, data.storedTimestamp);
        }
      });

//       bruno.collection("mower_log").insertOne(body, function(err, res) {
//         if (err){
//           console.log(err);
//         }
//         else{
//           console.log("1 document inserted");
//         }
//       });
    })
  }, interval);
}

// mongoClient.connect(`mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/`, function(err, db) {
//   if (err) throw err;
//   mongo = db;
//   bruno = mongo.db("bruno");
// 
//   init();
// });

init();
