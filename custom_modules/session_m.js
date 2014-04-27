var m      = require('./helpers');
var cookie = require('cookie');

var _sessions = {};

function removeSesssionBySID(sid) {
	if (sid in _sessions)
		delete _sessions[sid];
}

function getSessions() {
	return _sessions;
}

function getSessionBySID (sid) {
	if (sid in _sessions)
		return _sessions[sid];
	return null;
}

function checkSession (socket) {
	if (socket===null)
		return buildCheckMessage('error', 'null socket');
	if (!('id' in socket))
		return buildCheckMessage('error', 'no soid');

	var soid = socket.id;
	var cookie_string = socket.handshake.headers.cookie;
	if (cookie_string===null || cookie_string===undefined)
		return buildCheckMessage('error', 'undefined or null cookie');
	var parsed_cookies = cookie.parse(cookie_string);

	if (!('connect.sid' in parsed_cookies))
		return buildCheckMessage('error', 'no connect.sid');

	var sid = getSIDFromSocket(socket);
	if (!(sid in _sessions))
		buildSessionTemplate(socket);
	_sessions[sid].sockets[soid] = socket;
	_sessions[sid].cookies = parsed_cookies;
	return buildCheckMessage('ok', _sessions[sid].connected);
}

function setConnection(socket, connected, data) {
	var sid = getSIDFromSocket(socket);
	_sessions[sid].connected = connected;
	_sessions[sid].user_data = data;
}

function getConnection(sid) {
	if (!(sid in _sessions))
		return false;
	return _sessions[sid].connected;
}

function kill(socket) {
	var sid = getSIDFromSocket(socket);
	if (sid in _sessions)
		delete _sessions[sid];
}

function buildCheckMessage(type, message) {
	var ret = {};
	ret[type] = message;
	return ret;
}

function getSIDFromSocket (s) {
	var cookie_string = s.handshake.headers.cookie;
	var parsed_cookies = cookie.parse(cookie_string);
	return parsed_cookies['connect.sid'];
}

function removeSocketFromSession(socket) {
	var sid = getSIDFromSocket(socket);
	if (!(sid in _sessions)) return;
	if (socket.id in _sessions[sid].sockets)
		delete _sessions[sid][socket.id];
}

function buildSessionTemplate(socket) {
	var sid = getSIDFromSocket(socket);
	if (sid in _sessions) return;
	_sessions[sid] = {
		sockets: {},
		cookies: {},
		connected: false,
		user_data: null
	};
}

exports.removeSesssionBySID = removeSesssionBySID;
exports.getSessions         = getSessions;
exports.getSessionBySID     = getSessionBySID;
exports.checkSession        = checkSession;
exports.getConnection       = getConnection;
exports.setConnection       = setConnection;
exports.getSIDFromSocket    = getSIDFromSocket;
exports.kill                = kill;
exports.buildSession        = buildSessionTemplate;