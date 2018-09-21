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
		var options={
			email_id:req.query.email_id,
		}
		sails.config.filters.active.forEach(function(filter_name){
			options.email_type=filter_name;
			queue.create('deepCrawl',{
				title:'deepCrawl - '+options.email_id+' - '+options.email_type,
				options:options
			}).delay(100) // 1 min delay
				.priority('high')
				.save();
		});
		res.send('added to kue');
	},
	test:function(req,res){
		console.log('background test');
		res.send('background test');
	}
};
