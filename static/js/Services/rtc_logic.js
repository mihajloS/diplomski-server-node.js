function initRtc (session) {
	if (!session.loggedin) return;
	var person_id = personIDGen(session.data.user_id);

	easyrtc.setSocketUrl(":3000");
	easyrtc.setRoomOccupantListener(onRoomJoinListener);
	easyrtc.setUsername(person_id)

	var connectSuccess = function (myID) {
		console.log(" : My easyrtcid is " + myID);
		$('#mCallerHangUp').click(function() {
			easyrtc.hangupAll();
			toggleVideoElements(false);
		});
	};
	var connectFailure = function(errmesg) {
		console.log(" : Connect error " + errmesg);
	};
	easyrtc.setStreamAcceptor( function(callerEasyrtcid, stream) {
		console.log(' : callerEasyrtcid =>', callerEasyrtcid);
		console.log(' : stream =>', stream);
		var video = document.getElementById('caller');
		easyrtc.setVideoObjectSrc(video, stream);
	});

	easyrtc.setAcceptChecker( function(callerId, reporterFunction) {
		var acceptTheCall = function(wasAccepted) {

			if( wasAccepted && easyrtc.getConnectionCount() > 0 ) {
				easyrtc.hangupAll();
			}
			reporterFunction(wasAccepted);
		};

		var person = findPersonByRtcID(callerId);
		if (person===null) return console.log('No person with rtcid =>', callerId);

		if( easyrtc.getConnectionCount() > 0 ) {
			noty({
				text:'Incoming call from ' + person.nickname + '. Accept this one and hang up current?',
				layout: 'topRight',
				modal: false,
				type: 'information',
				buttons: [{addClass: 'btn btn-primary', text: 'Ok', onClick: function($noty) {
								acceptTheCall(true);
								$noty.close();
							}
							},
							{addClass: 'btn btn-danger', text: 'Cancel', onClick: function($noty) {
								acceptTheCall(false);
								$noty.close();
							}
						}]
			});
			console.log('Drop current and accept new one, fixme');
			return;
		}

		noty({
			text: 'Accept incoming call from ' + person.nickname,
			layout: 'topRight',
			modal: false,
			type: 'information',
			buttons: [
				{addClass: 'btn btn-primary', text: 'Answer', onClick: function($noty) {
					acceptTheCall(true);
					toggleVideoElements(true);
					$noty.close();
				}
				},
				{addClass: 'btn btn-danger', text: 'Busy', onClick: function($noty) {
					acceptTheCall(false);
					toggleVideoElements(false);
					$noty.close();
				}
			}]
			});
		}
	);

	easyrtc.setOnStreamClosed( function (callerEasyrtcid) {
		toggleVideoElements(false);
		easyrtc.setVideoObjectSrc(document.getElementById('caller'), "");
	});
	easyrtc.initMediaSource(
		function(){       // success callback
			var selfVideo = document.getElementById("self");
			easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());
			easyrtc.connect("Company_Chat_Line", connectSuccess, connectFailure);
		},
		connectFailure
	);
}

function onRoomJoinListener(roomName, peerIds) {
	console.log(' : ' + roomName, 'has changes');
	console.log(peerIds);

	var media,
		person_id,
		person_div,
		person_uid,
		uids = {},
		conter = 0;
	for(var i in peerIds) {
		conter++;
		media = peerIds[i];
		if (!('username' in media)) continue;
		person_id = media.username;
		person_uid = personIDGen(person_id, true);
		if (person_uid in _people)
			_people[person_uid]['rtcid'] = i;
		uids[person_uid] = i;
		person_div = $('#' + person_id);
		if (person_div.length===0) continue;
		$(person_div).addClass('onlineWrap');
		$(person_div).find('.action_call').attr('lang', i);
	}

	for (var uid in _people) {
		if (!(uid in uids) && ('rtcid' in _people[uid]))
			delete _people[uid]['rtcid'];
	}
}

function toggleVideoElements(visible) {
	visible = (visible == true ? 'visible' : 'hidden');
	$('#caller').css('visibility', visible);
	$('#mCallerHangUp').css('visibility', visible);
}


function performCall(easyrtcid) {
	console.log(' : make call to', easyrtcid);
	easyrtc.call(easyrtcid, onCallSuccess, onCallError, onCallAccepted);
}

function onCallSuccess(easyrtcID) {
	console.log(' : call made to', easyrtcID);
	toggleVideoElements(true);
}

function onCallError(errorMessage) {
	console.log(" : call error", errorMessage);
}

function onCallAccepted(accepted, bywho) {
	console.log(' : call ' + (accepted?"accepted":"rejected")+ " by " + bywho);
	toggleVideoElements(accepted);
}