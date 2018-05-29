const dotenv = require('dotenv').config();
const request = require('request');
const mysql = require('mysql');

const ident_api = "https://iam-api.dss.husqvarnagroup.net/api/v3/token";
const main_api = "https://amc-api.dss.husqvarnagroup.net/v1"

let state = {};
let con = mysql.createConnection({
  host: "localhost",
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD
});

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
  con.connect(function(err) {
    if (err) throw err;
    console.log("Maria DB Connected!");
    getToken();
  });
}

function main(){
  getMowerStatus(function(body){
    console.log({
      "storedTimestamp": body.storedTimestamp,
      "batteryPercent": body.batteryPercent,
      "mowerStatus": body.mowerStatus,
      "operatingMode": body.operatingMode,
      "latitude": body.lastLocations[0].latitude,
      "longitude": body.lastLocations[0].longitude,
    })
  });
}

init();