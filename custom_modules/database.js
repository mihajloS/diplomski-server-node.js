//custom modules
var m              = require('./helpers');
var configuration  = require('./configuration');
var mail           = require('./mailer_m');
//native modules
var mysql        = require('mysql');
var cookieParser = require('cookie-parser')
var cookie       = require('cookie');

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
	connection.connect(function (err) {
		if (err===null) {
			m.traceText('mySql connection success');
			return;
		}
		m.traceText('SQL error message:' +  err);
	});
	handleSocketCalls(ss);
}

function handleSocketCalls(ss) {
	socketServer = ss;
	socketServer.on('connection', function(socket) {
		var stat = SES.checkSession(socket);
		socket.emit('sess', stat);
		m.traceText('Socket new connection');
		socket.on('getNav', function(cb) {
			getNavigation(socket, cb);
		});
		socket.on('getSession', function (cb) {
			getSession(socket, cb);
		});
		socket.on('login', function(data, cb) {
			logIn(socket, data, cb);
		});
		socket.on('logout', function() {
			logOut(socket);
		});
		socket.on('register_new_user', function(data, cb) {
			registerNewUser(socket, data, cb);
		});
		socket.on('sendContactData', function  (data, cb) {
			sendContactData(socket, data, cb);
		});
		socket.on('disconnect', function() {
			console.log('disc', socket.id);
		});
	});
}

//////////////////////
// Database queries //
//////////////////////

function logIn (socket, data, cb) {
	if (!('email' in data)) return;
	if (!('password' in data)) return;
	query = 'SELECT * from users AS u INNER JOIN userstotypes AS utt ON u.user_id = utt.user_id WHERE u.email = "' + data.email + '" and u.password = "' + data.password + '"';
	connection.query(query, function(err, rows, fields) {
		if (err) {
			m.errorResponce(err, cb, 'Login query error.');
			return;
		}
		if (rows.length===1) {
			SES.buildSession(socket);
			SES.setConnection(socket, true, rows[0]);
			m.successResponce(rows[0], cb, 'Authorisation success');
		}
		else if(rows.length < 1){
			m.errorResponce(null, cb, 'Authorisation error');
		}
		else {
			m.errorResponce(null, cb, "Server missmatch");
		}
	});
}

function logOut(socket) {
	SES.kill(socket);
}

function getSession (socket, cb) {
	var session = SES.getSessionForSocket(socket)
	if (typeof cb==="function") cb(SES.createSessionResponceObj(session));
}

function registerNewUser(socket, data, cb) {
	if (data===null || !('email' in data) || !('nickname' in data) || !('pass' in data) || !('pass_again' in data)) {
		m.errorResponce(null, cb,'Bad register data sent');
		return;
	}
	if (!m.validateEmail(data.email) || data.nickname.length < 3 || data.pass.length < 3 || data.pass_again.length < 3 || data.pass != data.pass_again) {
		m.errorResponce(null, cb, 'Bad register validation request');
		return;
	}

	var query = 'SELECT * from users WHERE email = "' + data.email + '" OR nickname = "' + data.nickname +'"';
	connection.query(query, function(err, rows, fields) {
		if (err)
			m.errorResponce(null, cb, 'Registration check error');
		else {
			if (rows.length===0) {
				query = 'INSERT INTO users (password, email, nickname, confirmed, reg_date) ' +
						'VALUES ("' + data.pass + '","' + data.email + '", "' + data.nickname +
						'", "' + CONSTS.USER_NON_CONFIRMED + '", "' + m.getUnixTimeStamp() + '")';
						console.log(query);
				connection.query(query, function(err, rows, fields) {
					if (err)
						m.errorResponce(null, cb, 'Registration error level 0');
					else {
						var last_id = rows.insertId;
						query = 'INSERT INTO userstotypes (user_id, type_id) VALUES ("' + last_id + '", "' + CONSTS.USER_TYPE_REGULAR + '")';
						connection.query(query, function(err, rows, fields) {
							if (err)
								m.errorResponce(null, cb, 'Registration error level 1');
							else {
								m.successResponce(null, cb, 'Registation success');
								if (!CONSTS.DEVELOPMENT)
									mail.sendMailAuthentication (data.email);
							}

						});
					}
				})
			}
			else {
				m.errorResponce(null, cb, 'User with same nickname or email allready exist');
			}
		}
	})
}

function sendContactData (socket, data , cb) {
	if (!('first_name' in data) || !('email' in data) || !('message' in data)) {
		m.errorResponce(null, cb, 'Server error: Bad contact parameters sent.');
		return;
	}
	if (data.first_name===null || data.email===null || data.message===null) {
		m.errorResponce(null, cb, 'Server error: Bad contact parameters sent.');
	}
	if (data.first_name.length < 3 || !(m.validateEmail(data.email)) || data.message.length < 20) {
		m.errorResponce(null, cb, 'Server error: Bad contact validation.');
	}

	var query = 'INSERT INTO contact_form(first_name, email, message) VALUES' + 
				' ("' + data.first_name + '","' + data.email + '","' + data.message + '")';
	connection.query(query, function(err, rows, fields) {
		if (err)
			m.errorResponce(null, cb, 'Server error: Sql contact error.');
		else {
			m.successResponce(null, cb, 'Message sent with success.');
		}

	});

}

function getNavigation (socket, cb) {
	var user_type = SES.getUserType(socket);
	var query = 'SELECT * FROM navigation AS n INNER JOIN navigationTOusers AS ntu ' +
				'ON n.nav_id = ntu.nav_id  WHERE ntu.user_type = ' + user_type + ' ORDER BY n.weight ASC';
	connection.query(query, function(err, rows, fields) {
		if (err)
			m.errorResponce(err, cb);
		else
			m.successResponce(rows, cb);
	})
}

exports.init = init;