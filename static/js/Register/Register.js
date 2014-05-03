function events_listener_session (session) {
	MTemplate.changeLoginButtonsState(session.data);
}

function events_listener_nav (data) {
	var nav = data.data;
	var nav_string = '';

	//fix class="active"
	for (var ic = 0; ic < nav.length; ic++) {
		nav_string += ' <li><a href="' + nav[ic].link + '"><span>' + nav[ic].name + '</span></a></li>';
	}

	var nav_list  = document.getElementById('navigation_box');
	nav_list.innerHTML = nav_string;
}

function events_listener_login (data) {
	if (data.error) {
		noty({
				text: data.message,
				layout: 'topRight',
				modal: false,
				type: 'error',
				killer: true
			});
	}
	MTemplate.changeLoginButtonsState(data.data);
}

function events_listener_logout(data) {
	MTemplate.changeLoginButtonsState(data);
}

function registerClick() {

	var pass_again = document.getElementById('tb_password_again');
	var pass       = document.getElementById('tbREG_password');
	var nickname   = document.getElementById('tb_nickname');
	var email      = document.getElementById('tbREG_email');

	pass_again.style.border = "1px solid #CCC"; 
	pass.style.border       = "1px solid #CCC";
	nickname.style.border   = "1px solid #CCC";
	email.style.border      = "1px solid #CCC";

	var what_went_wrong = '';

	if (!validateEmail(email.value)) {
		what_went_wrong += '<li>Your email address is in bad format</li>';
		email.style.border = "1px solid red";
	}
	if (nickname.value.length < 3) {
		what_went_wrong += '<li>Nickname must be at least 3 characters long</li>';
		nickname.style.border = "1px solid red";
	}
	if (pass.value.length < 3 || pass_again.value.length < 3) {
		what_went_wrong += '<li>Password must be at least 3 characters long</li>';
		pass.style.border = "1px solid red";
	}
	if (pass.value != pass_again.value) {
		what_went_wrong += "<li>Passwords don't match'</li>";
		pass_again.style.border = "1px solid red";
	}

	if (what_went_wrong.length > 0) {
		noty({
				text: what_went_wrong,
				layout: 'center',
				modal: true,
				type: 'error'
			});
	}
	else {
		registerData = {
			email      : email.value,
			nickname   : nickname.value,
			pass       : pass.value,
			pass_again : pass_again.value
		}
		MTemplate.sendRequest('register_new_user', registerData, onRegisterCallback);
	}

}

function onRegisterCallback(data) {
	console.log('register callback', data);
	if (data.error) {
		console.log(data.msg);
	}
	else {
		$('.hideMe').css('display', 'none');
		$('#register_success_message').css("display", 'block');
		$('.main_right').css('display', 'none');
		$('#message_top_register').css('display', 'none');
	}
}

function validateEmail(email) {
	var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
	if (reg.test(email))
		return true; 
	return false;
}

function initMApp() {
	MEvents.subscribe('session', events_listener_session);
	MEvents.subscribe('nav', events_listener_nav);
	MEvents.subscribe('login', events_listener_login);
	MEvents.subscribe('logout', events_listener_logout);

	$('#tb_password').bind('keyup', function(e) {
		if (e.keyCode===13) MTemplate.onLoginClick();
	});
}