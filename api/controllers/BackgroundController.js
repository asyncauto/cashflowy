/**
 * BackgroundController
 *
 * this is a blueprint controller
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 * 
 */
const async = require('async');
// var kue = require( 'kue' );
// var queue = kue.createQueue({
// 	prefix: 'q',
// 	redis: sails.config.redis_kue
// });
var Bull = require( 'bull' );
	// create our job queue
var queue = new Bull('queue',{redis:sails.config.bull.redis});
var moment = require('moment-timezone');

module.exports = {
	deepCrawl:function(req,res){
		if(!req.query.email_id)
			return res.send('missing mandatory query parameters');
		async.eachLimit(sails.config.filters.active,1,function(filter_name,next){
			var options={
				email_id:req.query.email_id,
				email_type:filter_name
			}
			var promise = queue.add('surface_crawl',{
				title:'deepCrawl - '+options.email_id+' - '+options.email_type,
				options:options
			});
			GeneralService.p2c(promise,next);
		},function(err){
			res.send('added to kue');
		});
	},

	test:function(req,res){
		console.log('background test');
		res.send('background test');
	},

	surfaceCrawl:function(req,res){
		BackgroundService.surfaceCrawl({user:req.body.user_id}, 
			function(err, results){
				if(err)
					throw err;
				res.send('added '+results.addToBull.length+' tasks to surface_crawl bull');
		});
	},
	
	sendWeeklyEmails:function(req,res){
		var filter={};
		if(req.query.user)
			filter.id=req.query.user;
		BackgroundService.sendWeeklyEmails(filter, function(err){
			if(err) return res.status(500).json({error: err.message});
			res.ok();
		})
	},

	sendMonthlyEmails:function(req,res){
		var filter={};
		if(req.query.user)
			filter.id=req.query.user;
		
		BackgroundService.sendMonthlyEmails(filter, function(err){
			if(err) return res.status(500).json({error: err.message});
			res.ok();
		});
	},

	calculateUAM:function(req,res){
		var options={};
		if(req.query.user)
			options.user=req.query.user;
		if(req.query.account)
			options.account=req.query.account;
		// if(req.query.snapshots)
			// options.snapshots=req.query.snapshots;

		if(Object.keys(options).length!=1)
			return res.send('query string not right');
		BackgroundService.calculateUAM(options,function(err){
			if(err)
				throw err;
			res.send('snapshots updated');
		})
			
	},
	
	deleteTasks:function(req,res){
		var state = req.query.state?req.query.state:'completed';
		var n = req.query.n?req.query.n:1000;
		queue.clean(n,state);
		res.send(n+' tasks of state = '+state + ' should be deleted');
	}
};
