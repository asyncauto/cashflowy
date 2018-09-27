/**
 * BackgroundController
 *
 * this is a blueprint controller
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 * 
 */
const async = require('async');
var kue = require( 'kue' );
var queue = kue.createQueue({
	prefix: 'q',
	redis: sails.config.redis_kue
});

module.exports = {
	deepCrawl:function(req,res){
		if(!req.query.email_id)
			return res.send('missing mandatory query parameters');
		async.eachLimit(sails.config.filters.active,1,function(filter_name,next){
			var options={
				email_id:req.query.email_id,
				email_type:filter_name
			}
			queue.create('deepCrawl',{
				title:'deepCrawl - '+options.email_id+' - '+options.email_type,
				options:options
			}).delay(100) // 1 min delay
				.priority('high')
				.save();
			next(null);
		},function(err){
			res.send('added to kue');
		});
	},
	test:function(req,res){
		console.log('background test');
		res.send('background test');
	},
	surfaceCrawl:function(req,res){
		async.auto({
			getEmails:function(callback){
				Email.find({user:req.body.user_id}).exec(callback);
			},
			addToKue:['getEmails',function(results,callback){
				var kue_configs=[];
				sails.config.filters.active.forEach(function(filter){
					results.getEmails.forEach(function(email){
						var data={
							title:'surface_crawl, email ='+email.id+', filter='+filter,
							options:{ // this is used
								email_id:email.id,
								email_type:filter,
								pageToken:null,
							},
							info:{ // this is for readability
								user:req.body.user_id
							}
						}
						kue_configs.push(data);
					});
				});
				async.eachLimit(kue_configs,1,function(data,next){
					queue.create('surface_crawl',data).priority('high').save(next);
				},function(err){
					callback(err,kue_configs);
				})
			}]
		},function(err,results){
			if(err)
				throw err;
			res.send('added '+results.addToKue.length+' tasks to surface_crawl kue');
		})
	}
};
