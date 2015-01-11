var _server;      // server ip
var _peopleWrap;  // wrapper div

function events_listener_session (session) {
	MTemplate.changeLoginButtonsState(session.data);
	MTemplate.listen('onChatMessage', onChatMessageListener);
	MTemplate.listen('userTracker', onUserChangeListener);
	MTemplate.sendRequest('getPeople', null, callback_getPeople);
	initRtc(session);
}

function onUserChangeListener(data) {
	MTemplate.sendRequest('getPeople', null, callback_getPeople);
}

function showHistory(person) {
	if (!(person.user_id in _chatHistory)) return;

	var textArea = $('#tb_message');
	textArea.val('');
	var message;
	for (var i = 0; i < _chatHistory[person.user_id].length; i++) {
		message = _chatHistory[person.user_id][i];
		message = person.nickname + ': ' + message ;
		if ((i+1) != _chatHistory[person.user_id].length)
			message = message + '\n';
		textArea.val(textArea.val() + message);
	}
}

function sendTextMessage () {
	var chatInputText = $('#tbChatMessage').val();
	if ($.trim(chatInputText).length===0) return;
	var to = personIDGen($('.mChatView').attr('lang'), true);
	MTemplate.sendRequest('sendChatMessage', {to: to, text: chatInputText}, callback_sendChatMessages);
	$('#tbChatMessage').val('');
	var textArea = $('#tb_message');
	var prefix = '\nMe: ';
	if (textArea.val().length===0)
		prefix = 'Me: ';
	chatInputText = prefix + chatInputText;
	textArea.val(textArea.val() + chatInputText);
	scrollBottom();
}

function callback_sendChatMessages(data) {
	console.log('message sent maybe', data);
}

function scrollBottom() {
	var textArea = $('#tb_message');
	textArea.scrollTop(textArea[0].scrollHeight);
}

function personIDGen(ID, get) {
	if (get)
		return ID.split('_')[1];
	return 'person_' + ID;
}

var _chatHistory = {};

function addMessageToHistory(from, text) {
	if (!(from.user_id in _chatHistory))
		_chatHistory[from.user_id] = [];
	_chatHistory[from.user_id].push(text);
}

function onChatMessageListener(data) {
	console.log('onChatMessageListener', data);
	var from = _people[data.from];
	if (from===undefined) return;

	addMessageToHistory(from, data.text);

	console.log('d(-_-)b >> disppppp', $(".mChatView").css('display'));
	if ($(".mChatView").css('display') === 'none') {
		var messaegText = from.nickname + ' says: ' + data.text;
		noty({
			text: messaegText,
			layout: 'topRight',
			modal: false,
			type: 'information',
			killer: true,
			closeWith: ['click'],
			callback: {
				onCloseClick: function(e) {
					debugger;
					var person_id = personIDGen(data.from);
					$(_peopleWrap).find('#' + person_id).find('.action_chat').click();
					$.noty.closeAll();
				}
			}
		});
	}
	else {
		var textArea = $('#tb_message');
		textArea.val(textArea.val() + '\n' + from.nickname + ': ' + data.text);
		scrollBottom();
	}
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
	MTemplate.sendRequest('getPeople', null, callback_getPeople);

}

function events_listener_logout(data) {
	MTemplate.changeLoginButtonsState(data);
	_peopleWrap.html('');
}

function initMApp () {
	_peopleWrap = $('#mPeopleWrapper');
	MEvents.subscribe('session', events_listener_session);
	MEvents.subscribe('nav', events_listener_nav);
	MEvents.subscribe('login', events_listener_login);
	MEvents.subscribe('logout', events_listener_logout);
	_server = configuration.serverAddress();

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
}