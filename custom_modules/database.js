//custom modules
var m              = require('./helpers');
var configuration  = require('./configuration');
var cookie    = require('cookie');
var cookieParser = require('cookie-parser')
//native modules
var mysql   = require('mysql');


var CONSTS = configuration.get();
var connection;
var socketServer;
var myStore;
var SES;

function init(ss, s) {
	SES = s;
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
		var stat = SES.checkSession(socket);
		console.log('SOCKET STAT', stat);
		socket.emit('sess', stat);
		m.traceText('Socket new connection');
		socket.on('login', function(data, cb) {
			logIn(socket, data, cb);
		});
		socket.on('logout', function() {
			logOut(socket);
		})
		socket.on('disconnect', function(s) {
			console.log('disc', socket.id);
		})
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
			SES.buildSession(socket);
			SES.setConnection(socket, true, rows);
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

function logOut(socket) {
	SES.kill(socket);
}


exports.init = init;