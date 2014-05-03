var MEvents = {
	_events: {},
	fire: function (eName, params) {
		if (eName in MEvents._events) {
			if (typeof MEvents._events[eName]==="function") {
				MEvents._events[eName](params);
				return;
			}
			console.warn('>> Bad event fire');
		}
	},
	subscribe: function(eName, event_listener) {
		if (typeof event_listener==="function") {
			MEvents._events[eName] = event_listener;
			return;
		}
		console.log('>> Bad event subscribe')
	}
}