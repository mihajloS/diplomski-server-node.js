var TEST_ROOM_ID = "About_test_tour";

function my_init() {
	easyrtc.setRoomOccupantListener(onRoomJoinListener);
	easyrtc.easyApp(TEST_ROOM_ID, "self", ["caller"], onInitialize);
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