/**
 * KueBootstrap.js
 * Bootstrap module that setups the queue and worker
 */ 
const async = require('async');
module.exports = function (callback) {

	var Bull = require( 'bull' );
	// create our job queue
	var queue = new Bull('queue',{redis:sails.config.redis_bull});
	sails.config.queue=queue;
	// var queue = kue.createQueue({redis:{
	// 	redis: sails.config.redis_bull
	// }});

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
		callback(null);
		
	};

	queue.process('surface_crawl',1,function(job,done){
		GmailService.getMessagesAndProcessEach(job.data.options,function(err,result){
			// if(err) // uncomment for debugging when the kue has errors
			// 	throw err;
			done(err,result);
		});
	});
	queue.process('send_email_report',1,function(job,done){
		NotificationService.sendEmailReport(job.data.options,function(err,result){
			// if(err) // uncomment for debugging when the kue has errors
			// 	throw err;
			done(err,result);
		})
	});


	queue.process('afterCreate_sli',1,function(job,done){
		TransactionService.createTransactionFromSLI(job.data, function(err, result){
			done(err, result);
		})
		// CashflowyService.afterCreate_SLI(job.data,function(err,result){
		// // CashflowyService.afterCreate_SLI(job.data.sli,function(err,result){
		// 	// if(err) // uncomment for debugging when the kue has errors
		// 	// 	throw err;
		// 	done(err,result);
		// })
	});

	


	// console.log('\n\n\n\n ******** kue setup ********');
	callback(null);
};
