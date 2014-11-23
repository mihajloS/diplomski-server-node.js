var MTemplate = {
	i18n_welcome_text: 'Welcome #USER#',

	//SERVER: 'http://192.168.0.107:3000',
	_socket: null,
	_loggedIn: false,

	initSocketObject: function () {
		initMApp();
		MTemplate._socket = io();
		MTemplate._socket.on('sess', function(message) {
			console.log('sess message', message);
			if (message===null || !('loggedin' in message))
				console.log('Server session error');
			else
				MTemplate._loggedIn = message.loggedin;
			MEvents.fire('session', message);
		});
		MTemplate.getNav(MTemplate.onNavCallback);
	},
	sendRequest: function(req_name, data, cb) {
		MTemplate._socket.emit(req_name, data, cb);
	},
	onNavCallback: function(data) {
		console.log('fire nav', data);
		MEvents.fire('nav', data);
	},
	onLoginClick : function () {
		var email    = document.getElementById('tb_email').value;
		var password = document.getElementById('tb_password').value;

		if (password.length===0 || email.length===0) return;

		MTemplate._socket.emit('login', {email: email, password: password}, MTemplate.loginCallback);
	},
	loginCallback: function (data) {
		if (!data.error) 
			MTemplate._loggedIn = true;
		MEvents.fire('login', data);
		MTemplate.getNav(MTemplate.onNavCallback);
	},
	onLogoutClick: function() {
		MTemplate._loggedIn = false;
		MTemplate._socket.emit('logout');
		MEvents.fire('logout', null);
		MTemplate.getNav(MTemplate.onNavCallback);
	},
	getSession: function (cb) {
		MTemplate._socket.emit('getSession', cb);
	},
	getNav: function (cb) {
		MTemplate._socket.emit('getNav', cb);
	},
	onSessionCallback: function (message) {
		console.log('d(-_-)b >> session message', message);
		MEvents.fire('session', message);
	},
	changeLoginButtonsState: function(data) {
		var nickname = '';
		if (data!==null && data!==undefined)
			if ('nickname' in data)
				nickname = data.nickname;
		var password = document.getElementById('tb_password');
		var email = document.getElementById('tb_email');
		var btn_login = document.getElementById('btn_login');
		var btn_logout = document.getElementById('btn_logout');
		var title_welcome = document.getElementById('title_welcome');

		if (MTemplate._loggedIn) {
			btn_login.style.display = 'none';
			btn_logout.style.display = 'inline';
			password.style.display = 'none';
			email.style.display = 'none';
			title_welcome.style.display = 'inline'
			title_welcome.innerHTML = MTemplate.i18n_welcome_text.replace("#USER#", $.trim(nickname));
		}
		else {
			btn_login.style.display = 'inline';
			btn_logout.style.display = 'none';
			password.style.display = 'inline';
			email.style.display = 'inline';
			title_welcome.style.display = 'none';
		}
	}
};