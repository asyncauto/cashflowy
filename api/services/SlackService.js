/*
	use this to ping an event to slack
*/
const RED_HEX = "#EB3449";
const GREEN_HEX = "#36a64f";

var generateNewSignupSlackContent = function(user) {
	// default content set to missed call error state
	var content = {
		"icon_emoji": ":robot_face:",
		"username": "highlyreco-bot",
		"attachments": [{
			"fallback": "New user signedup",
			"color": GREEN_HEX,
			"pretext": "New user signedup",
			"fields": [{
				"title": "Name",
				"value": user.name,
				"short": true
			}, {
				"title": "Twitter",
				"value": user.twitter,
				"short": true
			}]
		}]
	}
	return content;
};

var generateNewEmailSlackContent = function(user) {
	// default content set to missed call error state
	var content = {
		"icon_emoji": ":robot_face:",
		"username": "highlyreco-bot",
		"attachments": [{
			"fallback": "User entered email",
			"color": GREEN_HEX,
			"pretext": "User entered email",
			"fields": [{
				"title": "Name",
				"value": user.name,
				"short": true
			}, {
				"title": "Twitter",
				"value": user.twitter,
				"short": true
			}, {
				"title": "Email",
				"value": user.email,
				"short": true
			}]
		}]
	}
	return content;
};

module.exports = {
	generateNewSignupSlackContent: generateNewSignupSlackContent,
	generateNewEmailSlackContent:generateNewEmailSlackContent,
	pushToSlack: function(channel, content, callback) {
		var http = require("https");

		var options = {
			"method": "POST",
			"hostname": "hooks.slack.com",
			"port": null,
			"path": sails.config.slack_webhook,
			"headers": {
				"content-type": "application/json",
				"cache-control": "no-cache",
			}
		};

		var req = http.request(options, function(res) {
			var chunks = [];

			res.on("data", function(chunk) {
				chunks.push(chunk);
			});

			res.on("end", function() {
				var body = Buffer.concat(chunks);
				sails.log.info(body.toString());
				callback(null);
			});
		});
		req.on('error', function(err) {
			sails.log.info(err);
			callback(err);
		});
		if (channel) {
			content.channel = channel;
		}
		req.write(JSON.stringify(content));
		req.end();
	},

};