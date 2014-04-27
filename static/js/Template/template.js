var SERVER = 'http://localhost:3000';
var _socket = null;
var _loggedIn = false;


function initSocketObject () {
	_socket = io.connect(SERVER);
	_socket.on('sess', function(message) {
		console.log('sess message', message);
		if (message===null) return;
		if (!('ok' in message))
			console.log('Server session error');
		else
			_loggedIn = message.ok;
		changeLoginButtonsState();
	});
}

function changeLoginButtonsState() {
	var password = document.getElementById('tb_password');
	var email = document.getElementById('tb_email');
	var btn_login = document.getElementById('btn_login');
	var btn_logout = document.getElementById('btn_logout');
	if (_loggedIn){
		btn_login.style.display = 'none';
		btn_logout.style.display = 'inline';
		password.style.display = 'none';
		email.style.display = 'none';
	}
	else {
		btn_login.style.display = 'inline';
		btn_logout.style.display = 'none';
		password.style.display = 'inline';
		email.style.display = 'inline';
	}
}

function onLoginClick (argument) {
	var password = document.getElementById('tb_password').value;
	var email = document.getElementById('tb_email').value;

	if (password.length===0 || email.length===0) return;

	_socket.emit('login', {email: email, password: password}, loginCallback);
}

function loginCallback (err, data) {
	if ('error' in err) {
		console.log(err);
		return;
	}
	_loggedIn = true;
	changeLoginButtonsState();

	console.log('login callback', data);
}

function onLogoutClick() {
	_loggedIn = false;
	_socket.emit('logout');
	changeLoginButtonsState();
	console.log('logout clik');
}

function onRoomJoinListener(roomName, peerIds) {
	console.log(roomName, 'has changes:');
	console.log(peerIds);
	var otherClientDiv = document.getElementById('otherClients');
	//remove all old participants
	while (otherClientDiv.hasChildNodes()) {
		otherClientDiv.removeChild(otherClientDiv.lastChild);
	}
	//now add new with click call events on them
	for(var i in peerIds) {
		var button = document.createElement('button');
		button.onclick = function(easyrtcid) {
			return function() {
				performCall(easyrtcid);
			}
		}(i);

		label = document.createTextNode(i);
		button.appendChild(label);
		otherClientDiv.appendChild(button);
	}
}