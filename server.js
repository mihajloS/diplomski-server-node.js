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
var session        = require('express-session');
var cookieParser   = require('cookie-parser');


var CONSTS = configuration.get();
var app = express();
var mystore = new MemoryStore;

/**
 * Initial configuration of server
 */
app.use(cookieParser());
app.use(session({ store: mystore, secret: 'mijajlo' }));
app.use(express.static(__dirname + "/static/"));
//app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'html');
app.set('views', __dirname + "/static/private");
app.engine('html', engines.mustache);
app.set('case sensitive routes', false);
app.set('strict routing', false);


/**
 * Handle secure static pages requests
 */
app.get('/admin.html', function(req, res) {
	var cid = req.cookies['connect.sid'];
	var sessions = SES.getSessions();
	if (!(cid in sessions)) {
		res.redirect('404.html');
		return;
	}
	var user = sessions[cid];
	if (user.user_data === null || !('type_id' in user.user_data)) {
		res.redirect('404.html');
		return;
	}
	if (user.user_data.type_id.toString()!==CONSTS.USER_TYPE_ADMIN) {
		res.redirect('404.html');
		return;
	}
	res.render('admin');
})

/**
 * Handle other static pages requests
 */
app.get('/*', function(req, res) {
	var trigeredPath = m.getCurrentpage(req.path);
	res.render(trigeredPath, function(err, html) {
		if (err) {
			res.redirect('404.html');
		}
	});
})

app.get('*', function(req, res){
	res.redirect('404.html');
});

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

/**
 * Connecting to database
 */
mysql.init(socketServer, SES);

/**
 * Start easy rtc
 */
var rtc = easyrtc.listen(app, socketServer);