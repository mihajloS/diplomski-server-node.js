//custom modules
var m              = require('./helpers');
var configuration  = require('../static/js/Configuration/configuration.js');
var mail           = require('./mailer_m');
//native modules
var mysql        = require('mysql');

var CONSTS = configuration.get();
var connection;
var socketServer;
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
		//m.traceText('Socket new connection');
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
		socket.on('finish_registration', function (data, cb) {
			registerFinish(socket, data, cb);
		});
		socket.on('sendContactData', function  (data, cb) {
			sendContactData(socket, data, cb);
		});
		socket.on('getPeople', function(data, cb) {
			getPeople(socket, data, cb);
		});
		socket.on('sendChatMessage', function(data, cb) {
			sendChatMessage(socket, data, cb);
		})
		socket.on('disconnect', function() {
			var session = SES.getSessionForSocket(socket)
			if (session !== null && ('user_data' in session) && (session.user_data !== null) && ('user_id' in session.user_data))
				tellOthers(socket, false, session.user_data.user_id);
			SES.killSocket(socket);
		});
	});
}

//handle offline status, this is only handling online
function tellOthers(socket, loggedIn, id) {
	socket.broadcast.emit('userTracker', {id: id, loggedIn: loggedIn});
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
			tellOthers(socket, true, rows[0].user_id);
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
	var session = SES.getSessionForSocket(socket);
	if ((session !== null) && ('user_data' in session) && (session.user_data !== null) && ('user_id' in session.user_data))
		tellOthers(socket, false, session.user_data.user_id);
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
				var register_token_time = m.getUnixTimeStamp()
				query = 'INSERT INTO users (password, email, nickname, confirmed, reg_date) ' +
						'VALUES ("' + data.pass + '","' + data.email + '", "' + data.nickname +
						'", "' + CONSTS.USER_NON_CONFIRMED + '", "' + register_token_time + '")';
				connection.query(query, function(err, rows, fields) {
					if (err)
						m.errorResponce(null, cb, 'Registration error level 0');
					else {
						var last_id = rows.insertId;
						query = 'INSERT INTO userstotypes (user_id, type_id) VALUES ("' + last_id + '", "' + CONSTS.USER_TYPE_REGULAR + '")';
						connection.query(query, function(err, rows, fields) {
							if (err)
							{
								m.errorResponce(null, cb, 'Registration error level 1');
							}
							else {
								m.successResponce(null, cb, 'Registation success');
								if (!CONSTS.DEVELOPMENT) {
									var url_for_user = "http://" + CONSTS.SERVER_IP + ":" + CONSTS.SERVER_PORT + "/" +
										CONSTS.MAIL_REGISTER_PAGE + "?token=" + register_token_time + "&uid=" +  last_id;
									mail.sendMailAuthentication (data.email, url_for_user);
								}
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

function registerFinish (socket, data, cb) {
	if (!('token' in data) || !('uid' in data)) {
		m.errorResponce(null, cb, 'Bad finish register params.');
		return;
	}
	if (data.token===null || data.uid===null) {
		m.errorResponce(null, cb, 'Bad finish register params.');
		return;
	}
	var query = 'SELECT * FROM users WHERE reg_date = "' + data.token + '" AND user_id = "' + data.uid + '"';

	connection.query(query, function(err, rows, fields) {
		if (err) {
			console.log(err);
			m.errorResponce(null, cb, 'Server error: Bad request for register finish level 0.');
			return;
		}
		if (rows.length!==1) {
			console.log(rows);
			m.errorResponce(null, cb, 'Server error: Bad request for register finish level 0.2.');
			return;
		}
		else {
			query = 'UPDATE users SET confirmed = "' + CONSTS.USER_CONFIRMED + '" WHERE user_id = "' + data.uid + '"';
			connection.query(query, function(err, rows, fields) {
				if (err)
					m.errorResponce(null, cb, 'Server error: Sql register finish error level 1.');
				else {
					m.successResponce(null, cb, 'Registration complete success!');
				}
			});
		}

	});
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

function getPeople(socket, data, cb) {
	var session = SES.getSessionForSocket(socket);
	if ((session == null) || (!session.connected)) 
		return m.errorResponce(null, cb, 'You are not authorised for this request');

	var sessions = SES.getSessions();
	var ret = {};
	for (var sid in sessions) {
		if (!('user_data' in sessions[sid]) || (sessions[sid].user_data === null) || !('user_id' in sessions[sid].user_data)) continue;
		if (sessions[sid].user_data.user_id == session.user_data.user_id) continue;
		ret[sessions[sid].user_data.user_id] = sessions[sid].user_data;
	}
	m.successResponce(ret, cb, 'Got people with success');
}

function sendChatMessage(socket, data, cb) {
	if (!('to' in data) || !('text' in data))
		return m.errorResponce(null, cb, 'Bad parameters sent');
	console.log('>> incoming', data);
	var to = parseInt(data.to);
	var text = data.text;
	var session = SES.getSessionForSocket(socket);
	if (!session.connected)
		return m.errorResponce(null, cb, 'You are not logged in');
	console.log('from session', session);
	var sessions = SES.getSessions();
	var singleSocket;
	for (var sid in sessions) {
		if (!('user_data' in sessions[sid]) || (sessions[sid].user_data === null) || !('user_id' in sessions[sid].user_data)) continue;
		if (sessions[sid].user_data.user_id == to) {
			for (var socID in sessions[sid].sockets) {
				debugger;
				singleSocket = sessions[sid].sockets[socID];
				singleSocket.emit('onChatMessage', {from: session.user_data.user_id, text: text});
			}
			return m.successResponce(null, cb, 'Message sent');
		}
	}

	return m.errorResponce(null, cb, 'No such user');
}

function addAvatar(req, res, filename, cb) {

	var session = SES.getSessionByReq(req);
	if ((session===null) || !(session.connected))
		cb(false);

	var query = "UPDATE `users` SET `image` = '" + filename + "' WHERE `user_id` = " + parseInt(session.user_data.user_id);
	connection.query(query, function(err, rows, fields) {
		console.log('d(-_-)b >> rows', rows);
		if (err || (rows===null) || !('affectedRows' in rows) || (rows.affectedRows!='1'))
			return cb(false);
		session.user_data.image = filename;
		var success = SES.updateSesssionUserData(session, session.user_data);
		return cb(success);
	});

//	cb(true);

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
exports.addAvatar = addAvatar;