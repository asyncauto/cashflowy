/**
 * Email.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var async = require('async');

module.exports = {

	attributes: {
		statement:{
			model:'statement',
			required:true
		},
		pos:{
			type:'number',
			columnType: 'int4',
			required:true
		},
		extracted_data: { // data originally extracted from statement
			type: 'json',
			required: true,
		},
		transaction:{
			model:'transaction'
		},
		org:{
			model:'org'
		},
		data: { // incase you want to write rules
			type: 'json',
		},
		details: { // additional stuff that you want to add
			type: 'json',
			defaultsTo:{}
		},
	},
	beforeCreate:function(sli,cb){
		if(!sli.data)
			sli.data=_.cloneDeep(sli.extracted_data);
		if(!sli.data.currency)
			sli.data.currency='INR';
		cb(null);
	},
	afterCreate:function(sli,cb){
		// is there a transaction that already exist
		// if yes link it to the transaction
		// if not create a tranction
		var Bull = require( 'bull' );
		// create our job queue
		var queue = new Bull('queue',{redis:sails.config.bull.redis});
		var data={
			title:'afterCreate_sli, statement ='+sli.statement+', row='+sli.pos,
			sli:sli,
			info:{ // this is for readability
				// user:req.body.user_id
			}
		}
		queue.add('afterCreate_sli',sli).then(function(){
			cb(null);
		})
	}
};

