var mailgun = require('mailgun-js')({apiKey: sails.config.mailgun.api_key, domain: sails.config.mailgun.domain});
var ejs=require('ejs');
var async = require('async');

var generateHTML= function(email,cb){
	if(email.template && email.locals){
		// fs.readFile('emails/'+email.template+'.ejs','utf8', function(err,str){
		// 	email.content = ejs.render(str, email.locals, {});
		// 	cb(err,email);
		// });
		ejs.renderFile('views/emails/'+email.template+'.ejs', email.locals, function(err, str) {
			var html ='';
		    if (!err)
	    		html = str;
		    else 
		        console.log(err);
		    cb(err,html);	
		});
	}
	else
		cb('email object is malformed');
}

module.exports={
	sendEmail:function(options,callback){
		var data = {
			from: options.from,
			to: options.to,
			subject: options.subject,
			// html:'<b>test</b>. this is a sample email'
		};
		generateHTML({template:options.template,locals:options.locals},function(err,result){
			var inlineCss = require('inline-css');
			inlineCss(result, {url:' '}).then(function(html) {
				// console.log('\n\n\n\n -------- ');
				// console.log(html); 
				data.html=html;
				// callback(null);
				mailgun.messages().send(data, function (err, body) {
					console.log(body);
					callback(err);
				});	
			});
		})
		
	},
	parseEmailBodyWithBodyParser: function(options, cb){
		async.auto({
			extractDataFromMessageBody: function(cb){
				var opts={
					email_type:options.email_type,
					body:options.inbound_data['stripped-text']
				}
				GmailService.extractDataFromMessageBody(opts,cb);
			},
			findOrCreateParsedEmail: ['extractDataFromMessageBody', function(results, cb){
				var parsed_email={
					extracted_data:results.extractDataFromMessageBody.ed,
					user: options.user,
					type: options.email_type,
					body_parser_used:results.extractDataFromMessageBody.body_parser_used,
					email:options.email_address,
					message_id: options.inbound_data['Message-Id'],
					details: {
						inbound: options.inbound_data
					}
				}
				parsed_email.extracted_data.email_received_time= new Date(options.inbound_data['Date']);

				if(parsed_email.body_parser_used==''){
					var parsed_failure = {
						extracted_data:results.extractDataFromMessageBody.ed,
						user: options.user,
						email:options.email_address,
						message_id: options.inbound_data['Message-Id'],
						status: 'FAILED',
						details: {
							inbound: options.inbound_data
						}
					}
					Parse_failure.findOrCreate({message_id:parsed_email.message_id},parsed_failure).exec(function(err, pe){
						cb(err);
					});
				}else{		
					// console.log('parser success');
					Parsed_email.findOrCreate({message_id:parsed_email.message_id},parsed_email).exec(function(err, pe){
						cb(err, pe)
					});
				}
			}]
		},cb)
	},
	
	parseInboundEmail: function(inbound_data, callback){
		async.auto({
			getEmail: function(cb){
				Email.findOne({email:inbound_data.To}).exec(cb);
			},
			parseWithEachFilter:['getEmail', function(results, cb){
				if(!results.getEmail) return cb(null);
				var parsed_email; // store the Parse_email object in the variable, send to slack if this variable is empty
				async.someLimit(sails.config.filters.active, 1, function(filter, next){
					var data={
							email_id:results.getEmail.id,
							email_type:filter,
							inbound_data: inbound_data,
							user: results.getEmail.user,
							email_address: results.getEmail.email
					};
					MailgunService.parseEmailBodyWithBodyParser(data, function(err, pe){
						if(err) return next(err, true);
						if(pe.findOrCreateParsedEmail) {
							parsed_email=pe.findOrCreateParsedEmail;
							return next(null, true)
						}else{
							next(null, false);
						}
					})	
				},function(err){
					cb(err, parsed_email);
				})
			}],
			parseFailToSlack: ['parseWithEachFilter', function(results, cb){
				// don't send to slack if processEach able to parse the email body
				if(results.parseWithEachFilter) return cb(null);
				var text="Parsing email failure\n";
				text+="<-Email body->\n";
				text+=inbound_data['stripped-text'].trim();
				var content = {
					"icon_emoji": ":robot_face:",
					"username": "cashflowy_bot",
					"text":text,
				}
				SlackService.pushToSlack('cashflowy',content,cb);
			}]
		}, callback);
	},
}