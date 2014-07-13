var CONSTS = {
	DEVELOPMENT: true,

	SERVER_PORT: '3000',
	SERVER_IP  : 'localhost',

	DATABASE_IP  : 'localhost',
	DATABASE_USER: 'root',
	DATABASE_PASS: '',
	DATABASE_NAME: 'rtc',

	USER_NON_CONFIRMED : '0',
	USER_CONFIRMED     : '1',

	USER_TYPE_UNKNOWN  : '3',
	USER_TYPE_REGULAR  : '2',
	USER_TYPE_ADMIN    : '1',

	MAIL_REGISTER_PAGE: 'register_finish.html',
	MAIL_PROTOCOL: 'SMTP',
	MAIL_SERVICE : 'Gmail',
	MAIL_HOST: 'smtp.gmail.com',
	MAIL_USER: 'cleaninterfacesregister@gmail.com',
	MAIL_PASS: 'mihajlosupic',
	MAIL_FROM: 'Clean Interfaces',
	MAIL_SUBJECT_REGISTER: 'Clean Interfaces - registration'
};

exports.get = function() {
	return CONSTS;
};