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

	var updateES=function(job,callback){
		job.duration=parseInt(job.duration);
		job.delay=parseInt(job.delay);
		job.created_at=new Date(parseInt(job.created_at));
		job.promote_at=new Date(parseInt(job.promote_at));
		job.updated_at=new Date(parseInt(job.updated_at));
		job.started_at=new Date(parseInt(job.started_at));
		if(job.failed_at)
			job.failed_at=new Date(parseInt(job.failed_at));
		var esInput={
			index: 'mts_kue_jobs',
			type: 'job',
			id: job.id,
			body: job
		};
		// ElasticSearchService.createOrUpdate(esInput,function(err,result){
			// callback(err);
		// });
		callback('null');
		
	};

	// convert all active tasks to inactive - they did not complete execution because the server shut down previously

	kue.Job.rangeByState( 'active', 0, 20, 'asc', function( err, jobs ) {
	  // you have an array of maximum n Job objects here
	  // jobs.forEach(function(job){
		// :::TODO::: if the job is atleast 1hr old, then make the job inactive - this job is stuck
		// job.inactive(); // comment to prevented restart
	  // });
	});
	queue.on('job enqueue', function(id, type){
		console.log( 'Job %s got queued of type %s', id, type );

	});

	queue.on('job complete', function(id, result){
		kue.Job.get(id, function(err, job){
			if (err) return;
			updateES(job,function(err){
				if(!err)
					job.remove();
			});
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
				GmailService.getMessagesAndProcessEach(options,function(err,results){
					// 30 messages recieved and processed
					// update job progress
					if(err){
						next(err);
					}else{
						// for the next iteration
						options.pageToken = results.getMessages.nextPageToken;
						options.completed_messages += results.getMessages.messages.length;
						// if the code breaks
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
					}
				});
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

	queue.process('surface_crawl',1,function(job,done){
		GmailService.getMessagesAndProcessEach(job.data.options,done);
	});


	// console.log('\n\n\n\n ******** kue setup ********');
	callback(null);
};
