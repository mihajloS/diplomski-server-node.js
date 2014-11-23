var express = require('express');
var express_session = require('express-session');
var socket = require('socket.io');
var RedisStore = require('connect-redis')(express_session);
var http = require('http');
var cookie = require('cookie');

var session_store = new RedisStore();
var app = express();

app.use(express_session({ store: session_store, secret: 'mihajloSecret', saveUninitialized: true, resave: true}));
app.use(express.static(__dirname + '/static'));

var webServer = http.createServer(app).listen(3000, function() {
	console.log('Listening at 3000');
});

var io = socket.listen(webServer);


var connect = require('connect');
io.on('connection', function(socket_client) {
	var cookie_string = socket_client.request.headers.cookie;
	var parsed_cookies = cookie.parse(cookie_string);
	var connect_sid = parsed_cookies['connect.sid'];
	if (connect_sid) {
	session_store.get(connect_sid, function (error, session) {
		console.log('d(-_-)b >> connect_sid', connect_sid);
		//HOORAY NOW YOU'VE GOT THE SESSION OBJECT!!!!
	});
	}
});