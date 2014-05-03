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
/**
 * Make unix timeStamp
 * @return {int} Seconds from epoche
 */
function getUnixTimeStamp () {
	return Math.round(new Date().getTime()/1000);
}
/**
 * Validate email
 * @param  {String} email
 * @return {Boolena}       true if
 *                         validation is OK
 */
function validateEmail(email) {
	var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
	if (reg.test(email))
		return true; 
	return false;
}
/**
 * Build responce object for client
 * @param  {Boolean} error  Error existence
 * @param  {String} message Additional message
 * @param  {Object} data    Data you want to get back to client
 */
function buildResponceObject(error, message, data) {
	return {
		error   : error,
		message : message,
		data    : data
	};
}
/**
 * Execute callback with custom build object
 * if something went good
 * @param  {Object}   data Data for user
 * @param  {Function} cb   Users callback
 * @param  {String}   msg  Additional message for user
 */
function successResponce(data, cb, msg) {
	if (typeof cb!=="function") return;
	if (msg===undefined || msg===null) msg = '';

	cb ( buildResponceObject(false, msg, data) );
}
/**
 * Execute callback with custom build object
 * if something went bad
 * @param  {Object}   data Data for user
 * @param  {Function} cb   Users callback
 * @param  {String}   msg  Additional message for user
 */
function errorResponce(data, cb, msg) {
	if (typeof cb!=="function") return
	if (msg===undefined || msg===null) msg = '';

	cb ( buildResponceObject(true, msg, data) );
}

exports.getCurrentpage      = getCurrentpage;
exports.traceText           = traceText;
exports.getUnixTimeStamp    = getUnixTimeStamp;
exports.validateEmail       = validateEmail;
exports.buildResponceObject = buildResponceObject;
exports.errorResponce       = errorResponce;
exports.successResponce     = successResponce;