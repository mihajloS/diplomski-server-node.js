//custom modules
var configuration = require('../static/js/Configuration/configuration.js');
//native modules
var nodemailer = require("nodemailer");


var CONSTS = configuration.get();


var smtpTransport = nodemailer.createTransport(CONSTS.MAIL_PROTOCOL,{
	service: CONSTS.MAIL_SERVICE,
	host: CONSTS.MAIL_HOST,
	auth: {
		user: CONSTS.MAIL_USER,
		pass: CONSTS.MAIL_PASS
	}
});

function sendMailAuthentication (receiver, url) {
	//fix me, create registration confirm page and proper email
	var plainText = 'Registration email';
	var htmlText  = "<h1>Registraion email</h1>";
	var mailOptions = {
		from    : CONSTS.MAIL_FROM + '<' + CONSTS.MAIL_USER + '>',
		to      : receiver,
		subject : CONSTS.MAIL_SUBJECT_REGISTER,
		text    : 'Hi from Clean Interfaces, please confirm you registration by going on this link: ' + url,
		html    : '<h1>Hi from <i>Clean Interfaces</i></h1></br><p>Please confirm your registration by clicking on<a href="' + url + '"> linked area</a></p>'
	};

	smtpTransport.sendMail(mailOptions, function(error, response){
		if(error){
			console.log(error);
		}
		else {
			console.log("Message sent: " + response.message);
		}

		// if you don't want to use this transport object anymore, uncomment following line
		//smtpTransport.close(); // shut down the connection pool, no more messages
	});
}

exports.sendMailAuthentication = sendMailAuthentication;