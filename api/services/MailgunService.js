var mailgun = require('mailgun-js')({apiKey: sails.config.mailgun.api_key, domain: sails.config.mailgun.domain});
var ejs=require('ejs');

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
		
	}	
}