var fs = require('fs');
var db = require('./database.js');

function avatar(req, res) {
	var fstream;
	req.pipe(req.busboy);
	req.busboy.on('file', function (fieldname, file, filename) {
		console.log("Uploading: " + filename);
		var path = '/../files/' + filename;
		fstream = fs.createWriteStream(__dirname + path);
		file.pipe(fstream);
		fstream.on('close', function () {
			db.addAvatar(req, res, filename, function (success) {
				if (success)
					res.end(filename);
				else
					res.end('false');
			});
		});
	});
}

function avatarDownload(req, res) {
	var filePath = __dirname + '/../files/' + req.params['imagePath'];
	var stat = fs.statSync(filePath);

	res.writeHead(200, {
		'Content-Length': stat.size
	});

	var readStream = fs.createReadStream(filePath);
	readStream.pipe(res);
}

exports.avatar = avatar;
exports.avatarDownload = avatarDownload;