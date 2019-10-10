/**
 * UserController
 *
 * this is a blueprint controller
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 * 
 */
var async = require('async');
module.exports = {
	filterTest: function (req, res) {
		var locals = {
			filters: sails.config.emailparser.filters,
			filter: undefined,
			mailgun_webhook_body: undefined,
			email_id: undefined,
			extracted_data: undefined,
			body_parser_used: undefined,
			error: undefined,
			status: undefined
		}
		if (req.body) {
			locals.mailgun_webhook_body = JSON.parse(req.body.mailgun_webhook_body);
			locals.email_id = MailgunService.findEmailIdFromWebhook(locals.mailgun_webhook_body);
			locals.filter = req.body.filter;
			async.auto({
				extractDataFromMessageBody: function (cb) {
					var opts = {
						email_type: locals.filter,
						body: locals.mailgun_webhook_body['body-plain'].replace(/[\r\n]+/g, " ")
					}
					EmailParserService.extractDataFromMessageBody(opts, cb);
				},
				exctractDatetimeforManualForward: function (cb) {
					var opts = {
						email_type: locals.filter,
						body: locals.mailgun_webhook_body['body-plain'].replace(/[\r\n]+/g, " ")
					}
					EmailParserService.extractDataFromMessageBody(opts, cb);
				}
			}, function (err, results) {
				if (err) {
					locals.status = 'error';
					locals.error = err.message;
				} else {
					locals.extracted_data =  results.extractDataFromMessageBody.ed;
					locals.body_parser_used = results.extractDataFromMessageBody.body_parser_used,
					locals.extracted_data.email_received_time = new Date(locals.mailgun_webhook_body['Date']);
					if (results.exctractDatetimeforManualForward && results.exctractDatetimeforManualForward.body_parser_used) {
						locals.extracted_data.forward_orignal_date = _.get(results, 'exctractDatetimeforManualForward.ed.datetime')
					}
				}
			})
		}
		res.view('curator/filter_test', locals);
	},
	listAllParseFailures:function(req,res){
		var limit = req.query.limit?parseInt(req.query.limit): 25;
		var page = req.query.page?parseInt(req.query.page):1;
		var skip = limit * (page-1);
		async.auto({
			getParseFailures:function(callback){
				Parse_failure.find()
					.sort('createdAt DESC')
					.limit(limit)
					.skip(skip)
					.exec(callback);
			},
		},function(err,results){
			var locals={
				parse_failures:results.getParseFailures,
				page: page,
				limit:limit,
			}
			res.view('curator/list_all_parse_failures',locals);
		})
	},
	resolveParseFailureManually:function(callback){
		if(req.body){
			//mark pf as resolved_manually
			Parse_failure.update({id:req.params.pf_id}).set({status:'RESOLVED_MANUALLY'}).exec(function(err,pf){
				if(err)
					throw err
				res.redirect(`curator/list_all_parse_failures`)
			})
		}else{
			res.view('curator/resolve_parse_failures')
		}
	},
	detectFileType:function(req,res){
		if (req.method == 'GET') {
			var locals = {
				type: '',
				message: ''
			}
			res.view('curator/detect_file_type', locals)
		}else{
			var u_file;
			req.file('file').upload(async function (err, uploadedFiles) {
				if (err) {
	
					console.log('err:');
					console.log(err);
				}else{
					console.log('files:');
					console.log(uploadedFiles);
					u_file=uploadedFiles[0];
					const util = require('util');
					const exec = util.promisify(require('child_process').exec);
					var fsExists = util.promisify(require('fs').exists);
					var uf = u_file.fd.split('/')
					
					uf[uf.length -1] = 'decrypted_'+uf[uf.length -1];
					uf = uf.join('/');

					if(req.body.password)
						try{
							const { stdout, stderr } = await exec(`qpdf -password=${req.body.password} -decrypt ${u_file.fd} ${uf}`);
							console.log('output', stdout, stderr);
						}
						catch(error){
							// pass
							console.log('error', error);
							var locals={
								type:"",
								message:"Entered password is invalid"
							}
							res.view('curator/detect_file_type', locals)
						}
					else{
						var statement_passwords=[];//get this from org details
						for (const sp of _.union(statement_passwords, [''])) {
							try{
								const { stdout, stderr } = await exec(`qpdf -password=${sp} -decrypt ${u_file.fd} ${uf}`);
								console.log('output', stdout, stderr);
							}
							catch(error){
								// pass
								console.log('error', error);
							}
						}
					}
					var decrypted_file_exists = await fsExists(uf);
					if(decrypted_file_exists){
						// if worked
						console.log('uf:');
						console.log(uf);
						const fs = require('fs');
						const pdf = require('pdf-parse');
						
						let dataBuffer = fs.readFileSync(uf);

						pdf(dataBuffer).then(function(data) {
							// PDF text
							console.log(data.text); 
							var detected_file_type=GeneralService.detectFileType(data.text)
							console.log('detected type:');
							console.log(detected_file_type);
							
							// res.status(200).json(locals)
							if(!detected_file_type || detected_file_type==""){
								var locals={
									message:'Cannot recognize the file type'
								}

							}else{
								var locals={
									type:detected_file_type,
									message:''
								}
								
							}
							res.view('curator/detect_file_type', locals)
							
						});		
						


					}
					else{
						var locals={
							type:'',
							message:'Password decryption failed'
						}
						// res.status(200).json(locals)
						res.view('curator/detect_file_type', locals)
					}
						// throw new Error('PASSWORD_DECRYPTION_FAILED');
				}
				
	
			});


			
			// res.status(200).json(req.file)
		}

	}
	
};
