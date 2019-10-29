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

var findEmailIdFromWebhook = function (inbound_data) {
	//check for manual forward or auto forward
	var email = inbound_data.To.includes("@" + sails.config.mailgun.domain) ? inbound_data.sender.toLowerCase() :
		inbound_data.To.toLowerCase()
	return email;
}

var findOrgEmailFromWebhook = function (inbound_data) {
	//check for manual forward or auto forward
	var org_email = inbound_data.To.includes("@" + sails.config.mailgun.domain) ? inbound_data.To.toLowerCase() :
		inbound_data['X-Forwarded-To'].toLowerCase()
	return org_email;
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
					body: options.inbound_data['body-plain'].replace(/[\r\n]+/g, " ")
				}
				EmailParserService.extractDataFromMessageBody(opts, cb);
			},
			exctractDatetimeforManualForward: function (cb) {
				var opts = {
					email_type: 'GmailManualForwardDateFilter',
					body: options.inbound_data['body-plain'].replace(/[\r\n]+/g, " ")
				}
				EmailParserService.extractDataFromMessageBody(opts, cb);
			},
			findOrCreateParsedEmail: ['extractDataFromMessageBody', 'exctractDatetimeforManualForward', function (results, cb) {
				var parsed_email = {
					extracted_data: results.extractDataFromMessageBody.ed,
					org: options.org,
					type: options.email_type,
					body_parser_used: results.extractDataFromMessageBody.body_parser_used,
					email: options.email,
					message_id: options.inbound_data['Message-Id'],
					details: {
						inbound: options.inbound_data
					}
				}
				parsed_email.extracted_data.email_received_time = new Date(options.inbound_data['Date']);
				if (results.exctractDatetimeforManualForward && results.exctractDatetimeforManualForward.body_parser_used) {
					parsed_email.extracted_data.forward_orignal_date = _.get(results, 'exctractDatetimeforManualForward.ed.datetime')
				}
				if (parsed_email.body_parser_used == '') {
					cb(new Error('INVALID_FILTER'));
				} else {
					//sails modifies the parsed_email after the query, clone and do operation.
					Parsed_email.findOrCreate({ message_id: parsed_email.message_id }, _.clone(parsed_email)).exec(function (err, pe, created) {
						if (err) return cb(err);
						if (!created) {
							Parsed_email.update({ id: pe.id }, _.clone(parsed_email)).exec(function (err, updated) {
								if (err) return cb(err);
								return cb(null, updated[0]);
							});
						} else {
							return cb(null, pe);
						}
					});
				}
			}],
			updateParseFailure: ['findOrCreateParsedEmail', function (results, cb) {
				Parse_failure.update({ message_id: results.findOrCreateParsedEmail.message_id },
					{
						parsed_email: results.findOrCreateParsedEmail.id,
						status: 'PARSED', extracted_data: results.findOrCreateParsedEmail.extracted_data
					}).exec(cb);
			}]
		}, cb)
	},

	parseInboundEmail: function (inbound_data, callback) {
		var sender_email = findEmailIdFromWebhook(inbound_data);
		async.auto({
			getOrg: function (cb) {
				var org_email = findOrgEmailFromWebhook(inbound_data);
				if (!org_email) return cb(new Error('ORG_NOT_FOUND'));
				Org.findOne({ email: org_email }).exec(function (err, org) {
					if (err) return cb(err);
					if (!org) return cb(new Error('ORG_NOT_FOUND'));
					return cb(null, org);
				});
			},
			sendBackGmailAutoForwardConfirmationCode: ['getOrg', function (results, cb) {
				if (inbound_data.subject.includes('Gmail Forwarding Confirmation'))
					mailgun.messages().send({
						from: 'support@cashflowy.in',
						to: inbound_data['stripped-text'].split(' ')[0],
						subject: "Cashflowy Fwd: "+ inbound_data.Subject,
						html: inbound_data['stripped-html']
					}, function (err, body) {
						console.log(body);
						cb(err);
					});
				else
					cb(null);
			}],
			parseWithEachFilter: ['sendBackGmailAutoForwardConfirmationCode', function (results, cb) {
				var parsed_email; // store the Parse_email object in the variable, send to slack if this variable is empty
				async.someLimit(sails.config.emailparser.filters, 1, function (filter, next) {
					var data = {
						email_type: filter.name,
						inbound_data: inbound_data,
						org: results.getOrg.id,
						email: sender_email
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
						case 'ORG_NOT_FOUND':
							return callback(err);
							break;
						case 'UNABLE_TO_PARSE':
							var parsed_failure = {
								org: results.getOrg.id,
								email: sender_email,
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

	createSmtpCredential: async function (options) {
		var DOMAIN = sails.config.mailgun.domain;
		var data = await mailgun.post(`/domains/${DOMAIN}/credentials`, { "login": options.email });
	},

	findEmailIdFromWebhook: findEmailIdFromWebhook
}