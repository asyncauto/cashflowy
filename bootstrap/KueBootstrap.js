/**
 * KueBootstrap.js
 * Bootstrap module that setups the queue and worker
 */ 
const async = require('async');
module.exports = function (callback) {
	var kue = require( 'kue' );

	// create our job queue

	var queue = kue.createQueue({
		prefix: 'q',
		redis: sails.config.redis_kue
	});

	// convert all active tasks to inactive - they did not complete execution because the server shut down previously

	kue.Job.rangeByState( 'active', 0, 20, 'asc', function( err, jobs ) {
	  // you have an array of maximum n Job objects here
	  jobs.forEach(function(job){
		// :::TODO::: if the job is atleast 1hr old, then make the job inactive - this job is stuck
		// job.inactive(); // comment to prevented restart
	  });
	});
	queue.on('job enqueue', function(id, type){
		console.log( 'Job %s got queued of type %s', id, type );

	});

	queue.on('job complete', function(id, result){
		kue.Job.get(id, function(err, job){
			if (err) return;
			// updateES(job,function(err){
				// if(!err)
					job.remove();
			// });
			console.log('Job '+job.id+' is successfully completed');
		});
	});

	queue.on('job failed', function(id, result){
		kue.Job.get(id, function(err, job){
			if (err) return;
			updateES(job,function(err){});
			console.log('Job '+job.id+' failed');
		});
	});

	queue.process('deepCrawl', 1, function ( job, done ) {
		if(!job.data.email_type)
			job.data.email_type='IciciCreditCardTransactionAlertFilter';
		var options={ 
			email_id:job.data.options.email_id,
			email_type:job.data.options.email_type,
			pageToken:null,// assuming that we are starting from a new task
			completed_messages:0, // total number of messages completed
		}
		
		if(job.progress_data){
			// assuming that we are retrying an interrupted job. 
			options.pageToken=job.progress_data.nextPageToken;
			options.completed_messages=job.progress_data.completed_messages;
		}
		async.forever( 
			function(next) {// getting 30 messages at a time and processing it
				async.auto({
					getEmailToken:function(callback){
						Email.findOne({id:options.email_id}).exec(function(err,email){
							callback(err,email.token);
						});
					},
					getMessages:['getEmailToken',function (results,callback) {
						var extract_config= require('../api/filters/'+options.email_type+'.js');
						var o={
							q:extract_config.gmail_filter,
							pageToken:options.pageToken?options.pageToken:null,
							email_token:results.getEmailToken,
						}
						GmailService.getMessages(o,callback);
					}],
					processEachMessage: ['getMessages', function (results, callback) {
						console.log('inside processEachMessage');
						var count=0;
						async.eachLimit(results.getMessages.messages,1,function(m,next){
							console.log("\n\n\n====== m_id="+m.id);
							console.log(count);
							count++;
							async.auto({
								getMessageBody:function(callback){
									var opts={
										message_id:m.id
									}
									GmailService.getMessageBody(opts,callback);
								},
								extractDataFromMessageBody:['getMessageBody',function(results,callback){
									var opts={
										email_type:options.email_type,
										body:results.getMessageBody
									}
									GmailService.extractDataFromMessageBody(opts,callback);
								}],
								findOrCreateEmail:['extractDataFromMessageBody',function(results,callback){
									// console.log('\n\n\nin findOrCreateEmail');
									// console.log(results.extractDataFromMessageBody);
									var email={
										extracted_data:results.extractDataFromMessageBody.ed,
										user:1,
										type:options.email_type,
										body_parser_used:results.extractDataFromMessageBody.body_parser_used,
										email:'alexjv89@gmail.com',
										message_id:m.id
									}
									if(email.body_parser_used==''){
										console.log('\n\n\nbody parser is null');
										console.log(email);
									}
									// during testing a new filter, comment/uncomment the following lines
									// console.log(email);
									// callback(null);
									Parsed_email.findOrCreate({message_id:m.id},email).exec(callback);
									// Parsed_email.findOrCreate({message_id:m.id},email).exec(function(err,result){
									// 	callback('manual error');
									// });
								}]
							},next)


						},function(err){
							if(err)
								throw err;
							callback(null);
							// console.log('everything done');
						})
						// results.getMessages.forEach()
					}]
				}, function (err, results) {
					// 30 messages recieved and processed
					// update job progress
					options.pageToken = results.getMessages.nextPageToken;
					options.completed_messages += results.getMessages.messages.length;
					var progress={
						completed_messages:options.completed_messages+results.getMessages.messages.length,
						nextPageToken:results.getMessages.nextPageToken,
					}
					job.progress(progress.completed_messages,progress.completed_messages+30,progress);
					// when all filter contains no more messages - nextPageToken key is missing
					if(!results.getMessages.nextPageToken && !err) // no error and nextPageToken does not exist
						next('done',results);
					else
						next(err,results);
				})
			},
			function(err) {
				if(err && err!='done')
					done(err);
				else{
					done(null); // marking the job as done
					// deep crawl done
					// mark the job as completed
				}
			}
		);
		
	});



	// console.log('\n\n\n\n ******** kue setup ********');
	callback(null);
};
