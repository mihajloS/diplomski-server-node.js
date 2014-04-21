//custom modules
var m              = require('./helpers');
var configuration  = require('./configuration');
//native modules
var mysql   = require('mysql');


var CONSTS = configuration.get();
var connection;
var socketServer;
var sessionSockets;

function init(ss) {
	connection = mysql.createConnection({
		user     : CONSTS.DATABASE_USER,
		password : CONSTS.DATABASE_PASS,
		database : CONSTS.DATABASE_NAME
	});
	connection.connect(connectionHandler);
	handleSocketCalls(ss);
}

function handleSocketCalls(ss) {
	socketServer = ss;
	socketServer.on('connection', function(socket) {
		m.traceText('Socket new connection');
		socket.on('login', function(data, cb) {
			console.log('!on login request');
			logIn(socket, data, cb);
		});
	});
}


function connectionHandler(err) {
	if (err===null) {
		m.traceText('mySql connection success');
		return;
	}
	m.traceText('SQL error message:' +  err);
}

function handleQueryError(err, cb) {
	m.traceText('SQL Error' + err);
	if (typeof cb==="function")
		cb({ "error": err });
}

function logIn (socket, data, cb) {
	if (!('email' in data)) return;
	if (!('password' in data)) return;
	query = 'SELECT * from user_data WHERE email = "' + data.email + '" and password = "' + data.password + '"';
	connection.query(query, function(err, rows, fields) {
		if (err) {
			handleQueryError(err, cb);
			return;
		}
		if (rows.length===1) {
			cb({}, rows);
		}
		else if(rows.length < 1){
			cb( {error: "Authorisation error"}, rows);
		}
		else {
			cb( {error: "Server missmatch"}, rows);
		}
	});
}


exports.init = init;