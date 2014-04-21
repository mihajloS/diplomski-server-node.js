/**
 * Trim ulr till his last '/' character
 * and return rest of the passed String
 * @param  {String} url Url to pocess
 * @return {String}     Procesed url
 */
function getCurrentpage(url) {
	var from = url.lastIndexOf('/');
	if (from < 0) return url;
	return url.substring(from + 1, url.length);
}
/**
 * Trace text with '>>>' in front of it
 * to notife server creator that this is
 * his trace
 * @param  {String} text Text to be traced
 */
function traceText(text) {
	try {
		console.log('>>> ' + text);
	}
	catch(e) {
		console.log('### traceText error ' + e);
	}
}

exports.getCurrentpage = getCurrentpage;
exports.traceText      = traceText;