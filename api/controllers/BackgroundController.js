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
		// get all users 
		// subtract disabled users - Mayank
		// identify the right week
		// add to quey
		var prevMonday = new Date();
		prevMonday.setDate(prevMonday.getDate() - (prevMonday.getDay() + 6) % 7);
		prevMonday=moment(prevMonday).tz('Asia/Kolkata').format();
		var end = new Date(prevMonday.substring(0,10)+'T00:00:00.000+0530');
		var start = new Date(end);
		start.setDate(start.getDate()-7);
		// '2018-09-24T00:00:00.000+0530'
		var filter={};
		if(req.query.user)
			filter.id=req.query.user;
		User.find(filter).exec(function(err,users){
			var kue_configs=[];
			users.forEach(function(user){
				var data={
					title:'Send weekly email to '+user.name,
					options:{
						start_date:start,
						end_date:end,
						user:user.id,
						type:'Weekly'
					},
					info:{}
				};
				kue_configs.push(data);
			})
			async.eachLimit(kue_configs,1,function(data,next){
				var promise = queue.add('send_email_report',data);
				GeneralService.p2c(promise,next);
			},function(err){
				res.send(kue_configs);
			});
		});
	},
	sendMonthlyEmails:function(req,res){
		var temp = new Date();
		temp.setDate(1);
		temp=moment(temp).tz('Asia/Kolkata').format();
		var end = new Date(temp.substring(0,10)+'T00:00:00.000+0530');
		var start = new Date(end);
		start.setDate(-5);
		start.setDate(1);
		var filter={};
		if(req.query.user)
			filter.id=req.query.user;
		User.find(filter).exec(function(err,users){
			var kue_configs=[];
			users.forEach(function(user){
				var data={
					title:'Send monthly email to '+user.name,
					options:{
						start_date:start,
						end_date:end,
						user:user.id,
						type:'Monthly'
					},
					info:{}
				};
				kue_configs.push(data);
			})
			async.eachLimit(kue_configs,1,function(data,next){
				var promise = queue.add('send_email_report',data);
				GeneralService.p2c(promise,next);
			},function(err){
				res.send(kue_configs);
			});
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
