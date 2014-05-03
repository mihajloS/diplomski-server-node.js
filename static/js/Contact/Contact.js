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

function sendContactData () {
	var message = document.getElementById('tb_message');
	var email = document.getElementById('tb_REGemail');
	var fn = document.getElementById('tb_fn');

	message.style.border = "1px solid #CCC"; 
	email.style.border   = "1px solid #CCC";
	fn.style.border      = "1px solid #CCC";

	var what_went_wrong = '';

	if (fn.value.length < 3) {
		what_went_wrong += '<li>Your name is too short (3 characters is minimun)</li>';
		fn.style.border = "1px solid red";
	}

	if (!validateEmail(email.value)) {
		what_went_wrong += '<li>Your email address is in bad format</li>';
		email.style.border = "1px solid red";
	}

	if (message.value.length < 20) {
		what_went_wrong += '<li>Your message is too short (20 characters is minimun)</li>';
		message.style.border = "1px solid red";
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
		var contactData = {
			first_name: fn.value,
			email     : email.value,
			message   : message.value
		};

		MTemplate.sendRequest('sendContactData', contactData, onConntactDataCallback)
	}
}

function onConntactDataCallback (data) {
	console.log('on contact data', data);
	if (data.error) {
		noty({
				text: data.message,
				layout: 'center',
				modal: false,
				type: 'error'
			});
	}
	else {
		$('.hideMe').css('display', 'none');
		$('#successMessage').css('display', 'block');
	}
}

function validateEmail(email) {
	var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
	if (reg.test(email))
		return true; 
	return false;
}

function initMApp () {
	MEvents.subscribe('session', events_listener_session);
	MEvents.subscribe('nav', events_listener_nav);
	MEvents.subscribe('login', events_listener_login);
	MEvents.subscribe('logout', events_listener_logout);

	$('#tb_password').bind('keyup', function(e) {
		if (e.keyCode===13) MTemplate.onLoginClick();
	});
}