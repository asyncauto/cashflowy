/**
 * Email.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var async = require('async');

module.exports = {

	attributes: {
		document:{
			model:'document',
			required:true
		},
		pos:{
			type:'integer',
			required:true
		},
		extracted_data: { // data originally extracted from statement
			type: 'json',
			required: true,
		},
		transaction:{
			model:'transaction'
		},
		user:{
			model:'user'
		}
	},
	afterCreate:function(sli,cb){
		// is there a transaction that already exist
		// if yes link it to the transaction
		// if not create a tranction
		var Bull = require( 'bull' );
		// create our job queue
		var queue = new Bull('queue',{redis:sails.config.redis_bull});
		queue.add('afterCreate_sli',sli).then(function(){
			cb(null);
		})
	}
};

