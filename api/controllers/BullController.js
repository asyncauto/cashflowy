/**
 * KueController
 * this controller shows things that are in the queue
 * @description :: Server-side logic for managing kues
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var kue = require( 'kue' );
var async = require('async');

 // create our job queue

// var queue = kue.createQueue({
// 	prefix: 'q',
// 	redis: sails.config.redis_kue
// });
var Bull = require( 'bull' );
	// create our job queue
var queue = new Bull('queue',{redis:sails.config.redis_bull});
module.exports = {
	index:function(req,res){
		var job_types=_.uniq(sails.config.kue_admin?sails.config.kue_admin.job_types:[]);
		var job_stats=[];
		queue.getJobCounts().then(function(counts){
			var locals={
				job_stats:[],
				overall_stats:counts
			}
			res.view('bull/index',locals);
		});
	},
	listItems:function(req,res){
		// var JSON = require('flatted');
		console.log('\n\n\n\n\n\n======================');
		console.log('inside listItemsInBull');
		var n = req.query.n?req.query.n:30;
		var page = req.query.page?req.query.page:1;
		var state = req.params.state?req.params.state:'active'
		var order_by=req.query.order_by?req.query.order_by:'asc';
		var start = (page-1)*n;
		var end = page*n-1;
		if(state!='active'&&state!='failed'&&state!='inactive'&&state!='complete'&&state!='delayed')
			return res.send('invalid state');
		var getJobs;
		switch(state){
			case 'active':
				getJobs=queue.getActive();
				break;
			case 'failed':
				getJobs=queue.getFailed();
				break;
			case 'inactive':
				getJobs=queue.getWaiting();
				break;
			case 'complete':
				getJobs=queue.getCompleted();
				break;
			case 'delayed':
				getJobs=queue.getDelayed();
				break; 
		}
		// if(req.query.job_type){
		// 	queue[job_type]().then(function(err,result){
		// 		console.log(err);
		// 		console.log(result);
		// 	})
			// kue.Job.rangeByType( req.query.job_type, req.params.state, start, end, order_by, function( err, jobs ) {
			// 	var new_jobs=[];
			// 	jobs.forEach(function(job){
			// 		var nj=JSON.parse(JSON.stringify(job));
			// 		nj.created_at=GeneralService.timeAgo(parseInt(job.created_at));
			// 		nj.updated_at=GeneralService.timeAgo(parseInt(job.updated_at));
			// 		new_jobs.push(nj);
			// 	})
			// 	var locals={
			// 		state:req.params.state,
			// 		req:req,
			// 		jobs:new_jobs,
			// 	}
			// 	res.view('kue/list_items',locals);
			// });	
		// }else{
		console.log('came until here');
			
		getJobs.then(function(jobs){
			
			var new_jobs=[];
			jobs.forEach(function(job){
				var nj=JSON.parse(JSON.stringify(job));
				nj.timestamp=GeneralService.timeAgo(parseInt(job.timestamp));
				nj.processedOn=GeneralService.timeAgo(parseInt(job.processedOn));
				nj.finishedOn=GeneralService.timeAgo(parseInt(job.finishedOn));
				new_jobs.push(nj);
			});
			var locals={
				state:req.params.state,
				jobs:new_jobs,
				o_jobs:jobs,
			}
			// res.send(locals);
			res.view('bull/list_items',locals);
		});
	},
	retryJob:function(req,res){
		var job_id=req.body.job_id?req.body.job_id:'';
		console.log(job_id);
		if(job_id=='')
			return res.send(400,'bad request');
		queue.getJob(job_id).then(function(job){
			job.retry().then(function(){
				console.log('Making job inactive now #%d', job.id);
				res.send(200,'ok')
			})
		});
		
	},
	deleteJob:function(req,res){
		var job_id=req.body.job_id?req.body.job_id:'';
		console.log(job_id);
		if(job_id=='')
			return res.send(400,'bad request');
		queue.getJob(job_id).then(function(job){
			job.remove().then(function(){
				console.log('removed completed job #%d', job.id);
				res.send(200,'ok')
			})
		});
	},
	restartQueueConnection:function(req,res){
		sails.config.queue.close().then(function(){
			sails.config.queue=new Bull('queue',{redis:sails.config.redis_bull});
		}).catch(function(err){
			console.log(err);
		})
	}
};

