/**
 * NotifySlackBootstrap.js
 * Bootstrap module notify slack that the server restarted. This is done only if the environment is production.
 */ 
const readLastLines = require('read-last-lines');
module.exports = function (callback) {
	if(process.env.NODE_ENV=='development'){
		// console.log('inside mocha service');
		var Mocha = require('mocha');
		var path  = require('path');
		var mocha = new Mocha({
			ui: 'tdd'     
		});
		// console.log(__dirname);
		// console.log(path.join(__dirname, '../test/services.test.js'));
		mocha.addFile(
			path.join(__dirname, '../test/services.test.js')
		);

		mocha.run(function(failures){
			console.log('\n\n\n-------');
			console.log(failures);
			if(failures)
				callback('errors in basic test cases');
			else
				callback(null);
			// console.log('exit');
		});
	}
	else
		callback(null);
};

