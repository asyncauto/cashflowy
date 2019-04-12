/**
 * Email.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var async = require('async');

module.exports = {

	attributes: {
		extracted_data: { // data originally extracted from email
			type: 'json',
			required: true,
		},
		data:{ // the processed version of extracted data. This can be modified by automation
			type: 'json',
			// required: true,	
		},
		email:{
			type:'string',
		},
		org: {
			model: 'org',
			required: true
		},
		type: {
			type: 'string',
			required: true,
			// enum:[
			// 	'credit_card_alert','credit_card_statement','bank_transaction_alert','bank_statement'
			// ]
		},
		body_parser_used:{
			type:'string',

		},
		message_id:{
			type:'string',
			required:true,
			unique:true,
		},
		transaction:{ // the accociated transaction
			model:'transaction',
			// required is true, but when initially created, it is created without a ref to transaction.
		},
		details:{
			type: 'json',
			columnType: 'jsonb'
		}
	},
	beforeCreate:function(pe,cb){
		// apply global modifier
		sails.config.emailparser.globalModifyData(pe);
		// apply particular filter
		var filter = _.find(sails.config.emailparser.filters, {name:pe.type});
		if(filter.modifyData)
			filter.modifyData(pe);

		// apply rules
		Rule.find({org:pe.org, status: 'active', trigger: 'parsed_email_before_create'}).exec(function(err,rules){
			rules.forEach(function(rule){
				// check if criteria matches the condition
				var status = _.isMatch(pe, _.get(rule, 'details.trigger.condition',{}));
				if(status){
					// executing action here. 
					if(rule.action=='modify_pe_data'){
						_.merge(pe,  _.get(rule, 'details.action.set',{}))
					}
				}
			});
			cb(null);
		})
	},
	afterCreate: function(pe, cb) {
		async.auto({
			getAccount:function(callback){
				var find = {
					acc_number:{
						endsWith: pe.data.acc_number, // ends with the following number
					},
					org:pe.org
				}

				var create={ // incase the account does not exist, create account.
					acc_number:''+pe.data.acc_number,
					org:pe.org,
					type:'bank', // user might need to change this
					name:'Auto generated account'+pe.data.acc_number,
				} 
				Account.findOrCreate(find, create).exec(function(err, result, created){
					callback(err,result);
				});
			},
			getToAccount:function(callback){
				// console.log('getToAccount');
				if(pe.data.type=='transfer'){
					var find = {
						acc_number:{
							endsWith: pe.data.acc_number, // ends with the following number
						},
						org:pe.org
					}

					var create={ // incase the account does not exist, create account.
						acc_number:''+pe.data.acc_number,
						org:pe.org,
						type:'investment', // user might need to change this
						name:'Auto generated account' + pe.data.acc_number,
					} 
					Account.findOrCreate(find, create).exec(callback);
				}else{
					callback(null);
				}
			},
			findOrCreateTransaction:['getAccount','getToAccount',function(results,callback){
				//skip if it only contains information about account balance.

				if(pe.data.type=='balance')
					return callback(null);
				const fx = require('money');
				fx.base='INR';
				fx.rates=sails.config.fx_rates;

				var t={
					original_currency:pe.data.currency,
					createdBy:'parsed_email',
					type: pe.data.type,
					account:results.getAccount.id,
					third_party: _.get(pe, 'data.third_party', null),
					original_amount: _.get(pe, 'data.original_amount', 0),
					amount_inr: _.get(pe, 'data.amount_inr', 0),
					occuredAt: _.get(pe, 'data.occuredAt', new Date())
				}

				// if transfer add to_account
				if(pe.data.type=='transfer'){
					t.to_account=results.getToAccount.id;
				}
		
				Transaction.create(t).exec(function(err,result){
					callback(err,result);
				});
				
			}],
			updateParsedEmail:['findOrCreateTransaction',function(results,callback){
				//skip if it only contains information about account balance.
				if(pe.data.type=='balance')
					return callback(null);
				Parsed_email.update({id:pe.id},{transaction:results.findOrCreateTransaction.id}).exec(callback);
			}],
			createSnapshotIfPossible:['getAccount',function(results,callback){
				// console.log('create snapshot');
				if(pe.data.balance_currency && pe.data.balance_amount){
					var ss={
						account:results.getAccount.id,
						createdBy:'parsed_email',
						// takenAt: new Date(pe.data.date+' '+pe.data.time+'+5:30'),
						balance_currency:pe.data.balance_currency,
						balance:pe.data.balance_amount,
						takenAt: pe.data.occuredAt
					}
					Snapshot.create(ss).exec(callback);
				}else if(pe.data.credit_limit_currency && pe.data.credit_limit_amount && pe.data.available_credit_balance){
					var ss={
						account:results.getAccount.id,
						createdBy:'parsed_email',
						// takenAt: new Date(pe.data.date+' '+pe.data.time+'+5:30'),
						balance_currency:pe.data.credit_limit_currency,
						balance:pe.data.available_credit_balance-pe.data.credit_limit_amount,
						takenAt: pe.data.occuredAt
					}
					Snapshot.create(ss).exec(callback);
				}else{
					callback(null);
				}
			}]
		},cb)
	}
};

