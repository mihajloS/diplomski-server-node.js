function events_listener_session (session) {
	console.log('session in index.js', session);
	MTemplate.changeLoginButtonsState(session.data);
	setup_page(session.loggedin);
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
	setup_page(!data.error);
	MTemplate.changeLoginButtonsState(data.data);
}

function events_listener_logout(data) {
	setup_page(false);
	MTemplate.changeLoginButtonsState(data);
}

function setup_page (logged) {
	if (logged) {
		$('#register_link').css('display', 'none');
	}
	else {
		$('#register_link').css('display', 'block');
	}
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