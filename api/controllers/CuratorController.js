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
	filterTest:function(req,res){
		var locals={
			filters:sails.config.filters.active,
			emails:[],
			m_id:'',
			email_id:'', //selected email id
			filter:'', // selected filter
			body_parser:'',
			message:'',
			status:'',
		}
		Email.find({}).exec(function(err,emails){
			locals.emails=emails;
			if(!req.body)
				res.view('curator/filter_test',locals);
			else{ // form submission
				// console.log(req.body);
				locals.m_id=req.body.m_id;
				locals.body_parser=req.body.body_parser;
				locals.email_id=req.body.email_id;
				locals.filter=req.body.filter;


				// var options={
				// 	message_id:req.body.m_id,
				// 	email_token:{"access_token":"ya29.GlseBh0SLKKkwEcexXkL-PR6JLzU5-EU3M4hGsFvKkWvJa52YUbx-4plIU6L8SYYS5zFu5BeBtO3DIQZdn7coLVybe-d_Sfg9gkLTPgTZfHd-UGwZNscR8qr301r","refresh_token":"1/GyJdn6WyVAnHnW2GHr33itKnCZbjw1FhVv4zTNKBHrF5Xl7Zk00sZl6IAZ3rytGK","scope":"https://www.googleapis.com/auth/gmail.readonly","token_type":"Bearer","expiry_date":1537429124331},
				// }
				// GmailService.getMessageDetails(options,function(err,details){
				// 	res.send('all good');
				// });





				async.auto({
					getEmailDetails:function(callback){
						Email.findOne({id:req.body.email_id}).exec(callback);
					},
					getMessageDetails:['getEmailDetails',function(results,callback){
						console.log('getMessageDetails');
						var options={
							message_id:req.body.m_id,
							email_token:results.getEmailDetails.token,
						}
						GmailService.getMessageDetails(options,callback);
					}],
					extractDataFromMessageBody:['getMessageDetails',function(results,callback){
						var filter_config = require('../filters/'+req.body.filter+'.js');
						// console.log('\n\n\nextractDataFromMessageBody');
						// console.log(filter_config.body_parsers);
						// var body_parser = _.find(filter_config.body_parsers,{version:req.body.body_parser});
						// console.log(body_parser);
						var options={
							email_type:req.body.filter,
							body_parser:_.find(filter_config.body_parsers,{version:req.body.body_parser}),
							// body_parser:req.body.body_parser,
							// body_parser:{},
							body:results.getMessageDetails.body
						}
						GmailService.extractDataFromMessageBodyUsingBodyParser(options,callback);
					}],
				},function(err,results){
					console.log('came here')
					
					results.parsed_email={
						extracted_data:results.extractDataFromMessageBody.ed,
						user:results.getEmailDetails.user,
						type:req.body.filter,
						body_parser_used:results.extractDataFromMessageBody.body_parser_used,
						email:results.getEmailDetails.email,
						message_id:req.body.m_id
					}
					results.parsed_email.extracted_data.email_received_time= new Date(results.getMessageDetails.header.date);
					if(results.parsed_email.body_parser_used==''){
						console.log('\n\n\nbody parser is null');
					}
					console.log(results.getMessageDetails.body);
					console.log(results.parsed_email);
					locals.results=results;
					locals.status='error';
					
					locals.message='got some data to show';
					res.view('curator/filter_test',locals);	
				});
			}
		});
	}
};
	