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
	if (inbound_data.recipient.includes("@" + sails.config.mailgun.domain))
		return inbound_data.recipient.toLowerCase()
	else
		return '';
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
			}
		}, cb)
	},

	parseInboundEmail: function (inbound_data, callback) {
		var sender_email = findEmailIdFromWebhook(inbound_data);
		var org_email = findOrgEmailFromWebhook(inbound_data);
		async.auto({
			getOrg: function (cb) {
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
						subject: "Cashflowy Fwd: " + inbound_data.Subject,
						html: inbound_data['stripped-html']
					}, function (err, body) {
						console.log(body);
						cb(err);
					});
				else
					cb(null);
			}],
			parseWithEachFilter: ['sendBackGmailAutoForwardConfirmationCode', function (results, cb) {
				var parsed_email = {
					org: results.getOrg.id,
					email: sender_email,
					message_id: inbound_data['Message-Id'],
					details: {
						inbound: inbound_data
					}
				};
				async.someLimit(sails.config.emailparser.filters, 1, function (filter, next) {
					var options = {
						email_type: filter.name,
						inbound_data: inbound_data,
						org: results.getOrg.id,
						email: sender_email
					};
					MailgunService.parseEmailBodyWithBodyParser(options, function (err, r) {
						if (err)
							return next(err, true);

						parsed_email.body_parser_used = r.extractDataFromMessageBody.body_parser_used
						if (parsed_email.body_parser_used) {
							parsed_email.extracted_data = r.extractDataFromMessageBody.ed;
							parsed_email.extracted_data.email_received_time = new Date(options.inbound_data['Date']);
							parsed_email.type = filter.name;
							parsed_email.status = 'PARSED';
							// if its manual forward, then add the forward_original_date to extracted_data.
							if (r.exctractDatetimeforManualForward && r.exctractDatetimeforManualForward.body_parser_used)
								parsed_email.extracted_data.forward_orignal_date = _.get(r, 'exctractDatetimeforManualForward.ed.datetime')
							return next(null, true);
						} else
							return next(null, false)
					})
				}, function (err) {
					if (!parsed_email.body_parser_used)
						parsed_email.status = 'PARSE_FAILED'
					cb(err, parsed_email);
				});
			}],
			findOrCreateParsedEmail: ['parseWithEachFilter', function (results, cb) {
				//sails modifies the parsed_email object after the query, clone and do operation.
				var to_create = _.clone(results.parseWithEachFilter)
				Parsed_email.findOrCreate({ message_id: to_create.message_id }, to_create).exec(function (err, pe, created) {
					if (err) return cb(err);
					if (!created) {
						var to_update = _.clone(results.parseWithEachFilter);
						Parsed_email.update({ id: pe.id }, to_update).exec(function (err, updated) {
							if (err) return cb(err);
							return cb(null, updated[0]);
						});
					} else {
						return cb(null, pe);
					}
				});
			}]
		},
			function (err, results) {
				var pe = results.findOrCreateParsedEmail;
				var slack_options = {
					icon_emoji: ":robot_face:",
					username: "cashflowy_bot",
					attachments: [
						{
							pretext: "Mailgun Webhook Failure",
							color: "#EB3449"
						}
					]
				}
				
				var text = `*Sender:* ${sender_email}\n *Receipient:* ${inbound_data.recipient}\n`
				text += `*Subject:* ${inbound_data.subject}\n\n`;
				text += "*Email body:*\n";
				text += inbound_data['body-plain'].trim() + `\n\n`;
				text += "*Error*\n"
				if (err) {
					switch (err.message) {
						case 'ORG_NOT_FOUND':
							text = `*Error:* Not able to find Org details \n\n` + text
							break;
						default:
							text = `*Error:* ${err.message}, ${pe ? 'PE: ' + pe.id : ''}\n` + text;
							break;
					}
					slack_options.attachments[0].text = text;
					SlackService.pushToSlack('cashflowy', slack_options, sails.log.info);
					return callback(err);
				} else {
					if (!pe.extracted_data) {
						//send parse failure emails to slack
						text = `*Error:* Parsing email failure, ${pe ? 'PE: ' + pe.id : ''}\n\n` + text;
						slack_options.attachments[0].text = text;
						SlackService.pushToSlack('cashflowy', slack_options, sails.log.info);
					}
					return callback(null, results);
				}
			});
	},

	createSmtpCredential: async function (options) {
		var DOMAIN = sails.config.mailgun.domain;
		var data = await mailgun.post(`/domains/${DOMAIN}/credentials`, { "login": options.email });
		return data;
	},

	findEmailIdFromWebhook: findEmailIdFromWebhook
}