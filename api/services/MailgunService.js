var mailgun = require('mailgun-js')({ apiKey: sails.config.mailgun.api_key, domain: sails.config.mailgun.domain });
var ejs = require('ejs');
var async = require('async');

var generateHTML = function (email, cb) {
	if (email.template && email.locals) {
		// fs.readFile('emails/'+email.template+'.ejs','utf8', function(err,str){
		// 	email.content = ejs.render(str, email.locals, {});
		// 	cb(err,email);
		// });
		ejs.renderFile('views/emails/' + email.template + '.ejs', email.locals, function (err, str) {
			var html = '';
			if (!err)
				html = str;
			else
				console.log(err);
			cb(err, html);
		});
	}
	else
		cb('email object is malformed');
}

module.exports = {
	sendEmail: function (options, callback) {
		var data = {
			from: options.from,
			to: options.to,
			subject: options.subject,
			// html:'<b>test</b>. this is a sample email'
		};
		generateHTML({ template: options.template, locals: options.locals }, function (err, result) {
			var inlineCss = require('inline-css');
			inlineCss(result, { url: ' ' }).then(function (html) {
				// console.log('\n\n\n\n -------- ');
				// console.log(html); 
				data.html = html;
				// callback(null);
				mailgun.messages().send(data, function (err, body) {
					console.log(body);
					callback(err);
				});
			});
		})
	},

	parseEmailBodyWithBodyParser: function (options, cb) {
		async.auto({
			extractDataFromMessageBody: function (cb) {
				var opts = {
					email_type: options.email_type,
					body: options.inbound_data['body-plain'].replace(/[\r\n]+/g," ")
				}
				GmailService.extractDataFromMessageBody(opts, cb);
			},
			exctractDatetimeforManualForward: function(cb){
				var opts = {
					email_type: 'GmailManualForwardDateFilter',
					body: options.inbound_data['body-plain'].replace(/[\r\n]+/g," ")
				}
				GmailService.extractDataFromMessageBody(opts, cb);
			},
			findOrCreateParsedEmail: ['extractDataFromMessageBody', 'exctractDatetimeforManualForward', function (results, cb) {
				var parsed_email = {
					extracted_data: results.extractDataFromMessageBody.ed,
					org: options.org,
					type: options.email_type,
					body_parser_used: results.extractDataFromMessageBody.body_parser_used,
					email: options.email_address,
					message_id: options.inbound_data['Message-Id'],
					details: {
						inbound: options.inbound_data
					}
				}
				parsed_email.extracted_data.email_received_time = new Date(options.inbound_data['Date']);
				if(results.exctractDatetimeforManualForward && results.exctractDatetimeforManualForward.body_parser_used){
					parsed_email.extracted_data.forward_orignal_date = _.get(results, 'exctractDatetimeforManualForward.ed.datetime')
				}
				if (parsed_email.body_parser_used == '') {
					cb(new Error('INVALID_FILTER'));
				} else {
					// console.log('parser success');
					Parsed_email.findOrCreate({ message_id: parsed_email.message_id }, parsed_email).exec(function (err, pe, created) {
						// log to status of the parsing to success.
						Parse_failure.update({ message_id: parsed_email.message_id },
							{
								parsed_email: pe.id,
								status: 'PARSED', extracted_data: parsed_email.extracted_data
							}).exec(function (err, pf_u) {
								sails.log.info(err, pf_u);
							});
						cb(err, pe)
					});
				}
			}]
		}, cb)
	},

	parseInboundEmail: function (inbound_data, callback) {
		async.auto({
			getEmail: function (cb) {
				//check for manual forward or auto forward
				var email = ((inbound_data.subject.startsWith("Fwd:") ||
					inbound_data["stripped-text"].startsWith("---------- Forwarded message ---------")) &&
					inbound_data.To.includes("@"+ sails.config.mailgun.domain)) ? inbound_data.sender.toLowerCase() :
					inbound_data.To.toLowerCase()
				Email.findOne({ email: email }).exec(function (err, email) {
					if (err) return cb(err);
					if (!email) return cb(new Error('EMAIL_NOT_FOUND'));
					return cb(null, email);
				});
			},
			parseWithEachFilter: ['getEmail', function (results, cb) {
				var parsed_email; // store the Parse_email object in the variable, send to slack if this variable is empty
				async.someLimit(sails.config.emailparser.filters, 1, function (filter, next) {
					var data = {
						email_id: results.getEmail.id,
						email_type: filter.name,
						inbound_data: inbound_data,
						org: results.getEmail.org,
						email_address: results.getEmail.email
					};
					MailgunService.parseEmailBodyWithBodyParser(data, function (err, pe) {
						if (err) {
							if (err.message == 'INVALID_FILTER')
								return next(null, false);
							return next(err, true);
						}
						parsed_email = pe.findOrCreateParsedEmail;
						return next(null, true)
					})
				}, function (err) {
					if (!parsed_email)
						return cb(new Error('UNABLE_TO_PARSE'));
					cb(err, parsed_email);
				})
			}]
		},
			function (err, results) {
				if (err) {
					switch (err.message) {
						case 'EMAIL_NOT_FOUND':
							return callback(err);
							break;
						case 'UNABLE_TO_PARSE':
							var parsed_failure = {
								org: results.getEmail.org,
								email: results.getEmail.email,
								message_id: inbound_data['Message-Id'],
								status: 'FAILED',
								details: {
									inbound: inbound_data
								}
							}
							Parse_failure.findOrCreate({ message_id: parsed_failure.message_id }, parsed_failure).exec(function (err, pf) {
								sails.log.info('parse failure created', err, pf);
								var text = `Parsing email failure ${pf.id}\n`;
								text += "<-Email body->\n";
								text += inbound_data['body-plain'].trim();
								var content = {
									"icon_emoji": ":robot_face:",
									"username": "cashflowy_bot",
									"text": text,
								}
								SlackService.pushToSlack('cashflowy', content, sails.log.info);
								return callback(err);
							});
							break;
						default:
							return callback(err);
							break;
					}
				} else {
					return callback(null, results);
				}
			});
	},

	createOrgEmail: function(options, callback){
		var DOMAIN = sails.config.mailgun.domain;
		var APIKEY = sails.config.mailgun.api_key;
		mailgun.post(`/domains/${DOMAIN}/credentials`, {"login": options.email}, function (error, body) {
			console.log(body);
		  });
	}
}