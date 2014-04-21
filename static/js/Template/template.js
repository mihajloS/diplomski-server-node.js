var SERVER = 'http://localhost:3000';
var _socket = null;

function onLoginClick (argument) {
	var password = document.getElementById('tb_password').value;
	var email = document.getElementById('tb_email').value;

	if (password.length===0 || email.length===0) return;

	_socket = io.connect(SERVER);
	_socket.emit('login', {email: email, password: password}, loginCallback);
}

function loginCallback (err, data) {
	var password = document.getElementById('tb_password');
	var email = document.getElementById('tb_email');
	var btn_login = document.getElementById('btn_login');
	if ('error' in err) {
		console.log(err);
		return;
	}

	password.style.display  = 'none';
	email.style.display     = 'none';
	btn_login.style.display = 'none';

	console.log('login callback', data);
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