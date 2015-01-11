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
var configuration  = require('./static/js/Configuration/configuration.js');
var m              = require('./custom_modules/helpers');
var mysql          = require('./custom_modules/database');
var SES            = require('./custom_modules/session_m');
var fileUpload     = require('./custom_modules/fileupload');
//native modules
var http           = require('http');
var engines        = require('consolidate'); 
var express        = require('express');
var express_session        = require('express-session');
var io             = require('socket.io');
var easyrtc        = require('easyrtc');
var path           = require('path');
var busboy         = require('connect-busboy');
var RedisStore     = require('connect-redis')(express_session);
var sys            = require('sys');

var CONSTS = configuration.get();
var express_session_store = new RedisStore();
var app = express();

/**
 * Initial configuration of server
 */
sys.puts(configuration.get());
app.use(express_session({ secret: 'mijajlo', saveUninitialized: true, resave: true }));
app.use(express.static(path.join(__dirname, 'static')));
app.set('view engine', 'html');
app.set('views', __dirname + "/static/private");
app.engine('html', engines.mustache);
app.set('case sensitive routes', false);
app.set('strict routing', false);
app.use(busboy());


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

app.get('/downloadAvatar/:imagePath', function(req, res) {
	fileUpload.avatarDownload(req, res);
});

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

app.post('/uploadAvatar', function (req, res) {
	fileUpload.avatar(req, res);
});



/**
 * Start listening on port 
 */
var webServer = http.createServer(app).listen(CONSTS.SERVER_PORT, function() {
	m.traceText('Server is listening on ' + webServer.address().address + ':' + webServer.address().port);
});

/**
 * Create socket
 */
var socketServer = io.listen(webServer);

/**
 * Connecting to database
 */
mysql.init(socketServer, SES);

/**
 * Start easy rtc
 */
var rtc = easyrtc.listen(app, socketServer);