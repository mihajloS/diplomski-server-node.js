//custom modules
var m             = require('./helpers');
var configuration = require('./configuration');
//native modules
var cookie = require('cookie');

var CONSTS = configuration.get();

var _sessions = {};

function removeSesssionBySID(sid) {
	if (sid in _sessions)
		delete _sessions[sid];
}

function getSessions() {
	return _sessions;
}

function getSessionBySID (sid) {
	var httpSid = 's:' + sid;
	if (sid in _sessions)
		return _sessions[sid];
	if (httpSid in _sessions)
	{
		m.traceText('Http sid requested ' + httpSid);
		return _sessions[httpSid];
	}
	return null;
}

function getSessionByReq (req) {
	if (req === null) return null;
	if (!('headers' in req) || req.headers===null) return null;
	if (!('cookie' in req.headers) || (req.headers.cookie===null)) return null;

	var cookies = cookie.parse(req.headers.cookie);
	if (!('connect.sid' in cookies)) return null;
	var sid = cookies['connect.sid'];

	if (sid in _sessions)
		return _sessions[sid];
	return null;
}

function checkSession (socket) {
	if (socket===null)
	{
		m.traceText('Session: socket is null');
		return buildCheckMessage('error', 'null socket');
	}
	if (!('id' in socket))
	{
		m.traceText('Session: id in socket is gone.');
		return buildCheckMessage('error', 'no soid');
	}

	var soid = socket.id;
	var cookie_string = socket.request.headers.cookie;
	if (cookie_string===null || cookie_string===undefined)
	{
		m.traceText('Bad cookie - undefined or null');
		return buildCheckMessage('error', 'undefined or null cookie');
	}

	var parsed_cookies = cookie.parse(cookie_string);

	if (!('connect.sid' in parsed_cookies))
	{
		m.traceText('Session: No connect.sid in socket cookie ' + cookie_string);
		return buildCheckMessage('error', 'no connect.sid');
	}

	var sid = getSIDFromSocket(socket);
	if (!(sid in _sessions))
		buildSessionTemplate(socket);
	_sessions[sid].sockets[soid] = socket;
	_sessions[sid].cookies = parsed_cookies;
	return createSessionResponceObj(_sessions[sid]);
}

function updateSesssionUserData (ses, user_data) {
	if (ses===null)                     return false;
	if (!('cookies' in ses))            return false;
	if (!('connect.sid' in ses.cookies)) return false;
	var sid = ses.cookies['connect.sid'];
	if (!(sid in _sessions) || !(_sessions[sid].connected)) return false;
	_sessions[sid]['user_data'] = user_data;
	return true;
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

function killSocket (socket) {
	var sid = getSIDFromSocket(socket);
	if (!(sid in _sessions)) return;

	var soid = socket.id;
	if (!('sockets' in _sessions[sid])) return;
	if (!(soid in _sessions[sid].sockets)) return;

	delete _sessions[sid].sockets[soid];
}

function buildCheckMessage(type, message) {
	var ret = {};
	ret[type] = message;
	return ret;
}

function getSIDFromSocket (s) {
	var cookie_string = s.request.headers.cookie;
	var parsed_cookies = cookie.parse(cookie_string);
	return parsed_cookies['connect.sid'];
}

function getSessionForSocket (s) {
	var sid = getSIDFromSocket(s);
	if (sid in _sessions)
		return _sessions[sid];
	return null;
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

function getUserType(socket) {
	var sid = getSIDFromSocket(socket);
	if (!(sid in _sessions)) return CONSTS.USER_TYPE_UNKNOWN;
	if (!('connected' in _sessions[sid])) return CONSTS.USER_TYPE_UNKNOWN;
	if (_sessions[sid].connected===false)
		return CONSTS.USER_TYPE_UNKNOWN;
	return _sessions[sid].user_data.type_id.toString();
}

function createSessionResponceObj (session) {
	if (session===null) return { loggedin : false, data : null };
	return { loggedin : session.connected, data : session.user_data };
}

exports.removeSesssionBySID      = removeSesssionBySID;
exports.getSessions              = getSessions;
exports.getSessionBySID          = getSessionBySID;
exports.getSessionByReq          = getSessionByReq;
exports.checkSession             = checkSession;
exports.updateSesssionUserData   = updateSesssionUserData;
exports.getConnection            = getConnection;
exports.setConnection            = setConnection;
exports.getSIDFromSocket         = getSIDFromSocket;
exports.kill                     = kill;
exports.killSocket               = killSocket;
exports.buildSession             = buildSessionTemplate;
exports.getUserType              = getUserType;
exports.getSessionForSocket      = getSessionForSocket;
exports.createSessionResponceObj = createSessionResponceObj;