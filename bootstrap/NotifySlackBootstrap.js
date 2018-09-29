/**
 * NotifySlackBootstrap.js
 * Bootstrap module notify slack that the server restarted. This is done only if the environment is production.
 */ 
const readLastLines = require('read-last-lines');
module.exports = function (callback) {
	if(process.env.NODE_ENV=='production'){
		var content = {"icon_emoji": ":robot_face:","username": "highlyreco-bot"};
		content.text = "Server Restart Alert - "+process.env.NODE_ENV;
		content.text+='\n Last few lines from the logs : '
		var count = 0;
		readLastLines.read('/var/log/nodejs/nodejs.log', 200).then(function(lines){
		// readLastLines.read('/Users/alex/ec2code/alex/test/server_log.txt', 50).then(function(lines){
			// console.log(lines);
			// console.log(typeof lines);
			var lines_arr=lines.split('\n');
			// console.log('\n\n\n\n');
			// console.log(lines_arr);
			// console.log(lines_arr.length)
			var start=count;
			lines_arr.forEach(function(line){
				// console.log('line '+count+':');
				// console.log(line);
				if(line.indexOf('"status":"REQUESTED"')>0)
					start=count;
				count++;
			});
			// console.log('\n\n\n');
			// console.log(start);
			// console.log('important piece of the log to send to slack');
			for(i=start;i<lines_arr.length;i++){
				// console.log(lines_arr[i]);
				if(lines_arr[i] && lines_arr[i].indexOf('i18n:debug')<0)
					content.text+='\n```'+lines_arr[i]+'```';
			}
			SlackService.pushToSlack('bugs',content,callback);
		});
	}
	else
		callback();
};

