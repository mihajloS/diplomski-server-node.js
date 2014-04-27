/*
██╗    ██╗███████╗██╗      ██████╗ ██████╗ ███╗   ███╗███████╗    ████████╗ ██████╗ 
██║    ██║██╔════╝██║     ██╔════╝██╔═══██╗████╗ ████║██╔════╝    ╚══██╔══╝██╔═══██╗
██║ █╗ ██║█████╗  ██║     ██║     ██║   ██║██╔████╔██║█████╗         ██║   ██║   ██║
██║███╗██║██╔══╝  ██║     ██║     ██║   ██║██║╚██╔╝██║██╔══╝         ██║   ██║   ██║
╚███╔███╔╝███████╗███████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║███████╗       ██║   ╚██████╔╝
 ╚══╝╚══╝ ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝       ╚═╝    ╚═════╝ 
                                                                                    
███╗   ███╗██╗   ██╗    ███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗            
████╗ ████║╚██╗ ██╔╝    ██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗           
██╔████╔██║ ╚████╔╝     ███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝           
██║╚██╔╝██║  ╚██╔╝      ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗           
██║ ╚═╝ ██║   ██║       ███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║           
╚═╝     ╚═╝   ╚═╝       ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝           
*/
//custom modules
var configuration  = require('./custom_modules/configuration');
var m              = require('./custom_modules/helpers');
var mysql          = require('./custom_modules/database');
var SES            = require('./custom_modules/session_m');
//native modules
var connect        = require('connect');
var cookie         = require('cookie');
var http           = require('http');
var engines        = require('consolidate'); 
var express        = require('express');
var io             = require('socket.io');
var easyrtc        = require('easyrtc');
var path           = require('path');
var MemoryStore    = require('connect').session.MemoryStore;
//var sesSoc = require('session.socket.io');
var session        = require('express-session');
var cookieParser = require('cookie-parser');


var CONSTS = configuration.get();
var app = express();
var mystore = new MemoryStore;
/**
 * Initial configuration of server
 */
///*app.configure(function() {
	app.use(express.static(__dirname + "/static/"));
	app.set('view engine', 'html');
	app.set('views', 'static');
	app.use(express.static(path.join(__dirname, 'public')));
	
	//
	app.use(cookieParser());
	app.use(session({ store: mystore, secret: 'mijajlo' }));
	app.get('/', function(req, res){
		res.send('Hello World!');
	});
	//
	//
	app.engine('html', engines.mustache);
	app.set('case sensitive routes', false);
	app.set('strict routing', false);
//});*/


/**
 * Handle static pages requests
 */
app.get('*', function(req, res) {
	var trigeredPath = m.getCurrentpage(req.path);

	res.render(trigeredPath, function(err, html) {
		if (err) {
			res.render('404');
		}
		else {
			res.render(trigeredPath);
		}
	});

})

/**
 * Start listening on port 
 */
var webServer = http.createServer(app).listen(CONSTS.SERVER_PORT, function() {
	m.traceText('Server is listening on localhost:' + CONSTS.SERVER_PORT);
});

/**
 * Create socket
 */
var socketServer = io.listen(webServer, { "log level": 1 });
//var sessionSockets = new sesSoc(io, mystore, connect.cookieParser());

/**
 * Setup socket and cookieParser
 */
/*socketServer.set('authorization', function (data, accept) {
	// check if there's a cookie header
	if (data.headers.cookie) {
		// if there is, parse the cookie
		data.cookie = connect.utils.parseSignedCookies(cookie.parse(decodeURIComponent(data.headers.cookie)),'express.sid');//parseCookie(data.headers.cookie);
		// note that you will need to use the same key to grad the
		// session id, as you specified in the Express setup.
		data.sessionID = data.cookie['express.sid'];
	} else {
		// if there isn't, turn down the connection with a message
		// and leave the function.
		return accept('No cookie transmitted.', false);
	}
	// accept the incoming connection
	accept(null, true);
});*/


/**
 * Connecting to database
 */
mysql.init(socketServer, SES);

/**
 * Start easy rtc
 */
var rtc = easyrtc.listen(app, socketServer);