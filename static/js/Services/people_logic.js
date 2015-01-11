var _people = {};

function findPersonByRtcID (rtcid) {
	for (var uid in _people) {
		if (!('rtcid' in _people[uid])) continue;
		if (_people[uid].rtcid != rtcid) continue;
		return _people[uid];
	}

	return null;
}

function callback_getPeople (data) {
	var person;

	startMark(); // mark all people for delete
	console.log('people data =>', data);

	for (var item in data.data) {
		person = data.data[item];

		updateLocalPersonData(person); // update local user data
		updatePerson(_people[person.user_id]);          // update html of person
		showHistory(person);           // show chat history of person
	}

	endMark(); // delete missing people
}

function updateLocalPersonData (person) {
	if (!(person.user_id in _people)) { // add person
		_people[person.user_id] = person;
	}
	else {                              // update person
		_people[person.user_id]['image'] = person.image;
		_people[person.user_id]['nickname'] = person.nickname;
	}
}

function updatePerson (person) {
	var person_div;
	var rtcid = '';
	var person_id = personIDGen(person.user_id);
	person_div = $('#' + person_id);
	if (('rtcid' in person) && (person.rtcid != undefined) && (person.rtcid != null))
		rtcid = person.rtcid;
	if (person_div.length == 0) {
		$(_peopleWrap).append('' +
		'<div class="mPerson" id="' + person_id + '">' +
			'<img class="person_avatar" src="http://' + _server + '/downloadAvatar/' + person.image + '"><br/>' +
			'<span>Nickname:</span><span class="person_nickname">' + person.nickname + '</span><br/>' +
			'<span><img class="action_call" lang="' + rtcid + '" src="../images/icons/handset.svg" alt="phone icon"/></span>' +
			'<span><img class="action_chat" lang=' + person_id + ' src="../images/icons/chat.svg" alt="chat icon"/></span>' +
		'</div>');
		person_div = $('#' + person_id);
	}
	else {
		$(person_div).find('img').first().attr('src', 'http://' + _server + '/downloadAvatar/' + person.image);
		$(person_div).find('.person_nickname').html(person.nickname);
		$(person_div).removeClass('marked');
	}

	if (rtcid.length==0)
		$(person_div).removeClass('onlineWrap');

	// av calls
	$(person_div).find('.action_call').on('click', function (e) {
		var rtcid = $(this).attr('lang');
		console.log('call =>', rtcid);
		if ($.trim(rtcid).length == 0) {
			noty({
				text:'Friend is not currently online.',
				layout: 'topRight',
				modal: false,
				type: 'warning'
			});
			return;
		}

		performCall(rtcid);
	});

	// chat messages
	$(person_div).find('.action_chat').on('click', function (e) {
		var userid = $(this).attr('lang');
		console.log('chat');
		var person_img = $(this).parent().parent().find('.person_avatar').attr('src');
		var person_nickname = $(this).parent().parent().find('.person_nickname').text();

		$('#mPeopleWrapper').hide('slow');
		$('.mChatView').show('slow');
		$('.mChatView').attr('lang', userid);
		$('#mChat_avatar').attr('src', person_img);
		$('#mChat_nickname').val(person_nickname);
		$('#mChat_nickname').css('textTransform', 'capitalize');
		$('#mChat_send').on('click', sendTextMessage);
		$('#tbChatMessage').on('keyup', function(e) {
			if (e.keyCode == 13) sendTextMessage();
		})
	});
}

function startMark() {
	$(_peopleWrap).find('div').each(function () {
		$(this).addClass('marked');
	})
}

function endMark () {
	$(_peopleWrap).find('div').each(function () {
		if ($(this).hasClass('marked'))
			$(this).remove();
	})
}