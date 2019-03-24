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
		user:{
			model:'user'
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
		sli.data=_.cloneDeep(sli.extracted_data);
		if(!sli.data.currency)
			sli.data.currency='INR';
		cb(null);
		// console.log('before create parsed email');
		// Rule.find({user:pe.user}).exec(function(err,rules){
		// 	// console.log('inside list of rules');
		// 	// console.log(pe.user);
		// 	// console.log(err);
		// 	// console.log(rules);
		// 	rules.forEach(function(rule){
		// 		// console.log('\n\nrule:')
		// 		// console.log(rule);
		// 		// console.log('\ncondition:')
		// 		// console.log(rule.details.trigger.condition)
		// 		var status = RuleService.evaluateCondition(rule.details.trigger.condition,pe);
		// 		// console.log("\nstatus = "+status);
		// 		if(status){
		// 			// executing action here. 
		// 			if(rule.action=='modify_data'){
		// 				if(rule.details.action.type=='modify_pe_data'){
		// 					Object.keys(rule.details.action.set).forEach(function(s_key){
		// 						// console.log(s_key);
		// 						if(s_key=='data.account_last_4_digits')
		// 							pe.data.account_last_4_digits=rule.details.action.set[s_key];
		// 					});
		// 				}
		// 			}
		// 			// console.log('\n\n\n -------');
		// 			// console.log(pe.data);
		// 		}
		// 	});
		// 	cb(null);
		// });

		// check if any rules apply. 
		// execute those rules. 
	},
	afterCreate:function(sli,cb){
		// is there a transaction that already exist
		// if yes link it to the transaction
		// if not create a tranction
		var Bull = require( 'bull' );
		// create our job queue
		var queue = new Bull('queue',{redis:sails.config.bull.redis});
		var data={
			title:'afterCreate_sli, document ='+sli.document+', row='+sli.pos,
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

