const dotenv = require('dotenv').config();
const request = require('request');

const ident_api = "https://iam-api.dss.husqvarnagroup.net/api/v3/token";
const main_api = "https://amc-api.dss.husqvarnagroup.net/v1"

let state = {};

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

getToken();

function main(){
	getMowerStatus(function(body){
		console.log(body)
	});
}