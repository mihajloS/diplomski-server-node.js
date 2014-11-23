var TEST_ROOM_ID = "About_test_tour";

function events_listener_session (session) {
	MTemplate.changeLoginButtonsState(session.data);
	MTemplate.sendRequest('getPeople', null, callback_getPeople);
}

function callback_getPeople (data) {
	var peopleWrap = $('#mPeopleWrapper');
	var people = data.data;

	var person;
	for (var item in people) {
		person = people[item];
		$(peopleWrap).append('' +
		'<div class="mPerson">' +
			'<img src="http://mihajlo.com:3000/downloadAvatar/' + person.image + '"><br/>' +
			'<span>Nickname:</span><span>' + person.nickname + '</span><br/>' +
			'<span>/chat/</span><span>/call/</span>' +
		'</div>');
	}
	for (var item in people) {
		person = people[item];
		$(peopleWrap).append('' +
		'<div class="mPerson">' +
			'<img src="http://mihajlo.com:3000/downloadAvatar/' + person.image + '"><br/>' +
			'<span>Nickname:</span><span>' + person.nickname + '</span><br/>' +
			'<span>/chat/</span><span>/call/</span>' +
		'</div>');
	}
	for (var item in people) {
		person = people[item];
		$(peopleWrap).append('' +
		'<div class="mPerson">' +
			'<img src="http://mihajlo.com:3000/downloadAvatar/' + person.image + '"><br/>' +
			'<span>Nickname:</span><span>' + person.nickname + '</span><br/>' +
			'<span>/chat/</span><span>/call/</span>' +
		'</div>');
	}
	for (var item in people) {
		person = people[item];
		$(peopleWrap).append('' +
		'<div class="mPerson">' +
			'<img src="http://mihajlo.com:3000/downloadAvatar/' + person.image + '"><br/>' +
			'<span>Nickname:</span><span>' + person.nickname + '</span><br/>' +
			'<span>/chat/</span><span>/call/</span>' +
		'</div>');
	}
	
	console.log('d(-_-)b >> getPeople responce', data);
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


//RTC

function my_init() {
	easyrtc.setRoomOccupantListener(onRoomJoinListener);
	easyrtc.easyApp(TEST_ROOM_ID, "self", ["caller"], onInitialize);
	$( ".av" ).toggle('slow');
}

function onInitialize (myID) {
	console.log("My easyrtcid is " + myID);
	console.log(easyrtc.events);
	
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

function performCall(easyrtcid) {
	easyrtc.call(easyrtcid, onCallSuccess, onCallError, onCallAccepted);
}

function onCallSuccess(easyrtcID) {
	console.log("completed call to " + easyrtcID);
}

function onCallError(errorMessage) {
	console.log("err:" + errorMessage);
}

function onCallAccepted(accepted, bywho) {
	console.log((accepted?"accepted":"rejected")+ " by " + bywho);
}

function initMApp () {
	MEvents.subscribe('session', events_listener_session);
	MEvents.subscribe('nav', events_listener_nav);
	MEvents.subscribe('login', events_listener_login);
	MEvents.subscribe('logout', events_listener_logout);

	$('#tb_password').bind('keyup', function(e) {
		if (e.keyCode===13) MTemplate.onLoginClick();
	});

	$( ".av" ).toggle();

	$('#tbSearch_connection').bind('keyup', function (e) {
		var sample = $(this).val().toLowerCase();

		$('#otherClients').find('button').each(function (index) {
			$(this).css('display', 'block');
		});

		$('#otherClients').find('button').each(function (index) {
			if ($(this).text().toLowerCase().indexOf(sample) === -1)
				$(this).css('display', 'none');
		});

	})

	$('#fileUploadFileSelect').on('change', function(e) {
		var files = $(this).prop('files');
		sendUploadRequest(files[0]);
	});
}

function sendUploadRequest (file) {
	var formData = new FormData();
	formData.append('Filedata', file, file.name);

	var request = $.ajax({
		type:'POST',
		url: 'http://192.168.189.128:3000/uploadAvatar',
		data:formData,
		cache:false,
		contentType: false,
		contentLength: file.size,
		processData: false,
		success:function(data, textStatus, jqXHR) {
			console.log('d(-_-)b >> success data', data);
		},
		error: function(data) {
			console.log('d(-_-)b >> error data', data);
		}
	});
}