/**
 * Transaction.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var async = require('async');

module.exports = {

	attributes: {
		original_currency:{
			type:'string',
		},
		original_amount:{
			type:'number',
			columnType:'float8'
		},
		amount_inr:{
			type:'number',	
			columnType:'float8'
		},
		occuredAt:{ // defaults to createdAt. Useful when creating manually. 
			type:'string',
			columnType: 'timestamptz'
		},
		createdBy:{
			type:'string',
			isIn:['user','parsed_email', 'parsed_document']
		},
		type:{
			type:'string',
			isIn:['income_expense','transfer']
		},
		description:{
			type:'string',
		},
		account:{ // from where the transaction is made
			model:'account',
			required:true
		},
		to_account:{ // only for transfers. The account to which you transferred the money to.
			model:'account',
		},
		third_party:{ // only for income/expense. 
			type:'string',
		},
		category:{
			model:'category'
		},
		tags:{
			collection:'tag',
			via:'transactions',
			dominant:true
		},
	},

	afterCreate: function(created, cb){
		async.auto({
			getAccount: function (cb) {
                Account.findOne(created.account).exec(cb);
            },
			applyRule: ['getAccount', function(results, cb){
				Rule.find({user: results.getAccount.user, status: 'active', trigger: 'transaction_after_create'}).exec(function(err,rules){
					rules.forEach(function(rule){
						// check if criteria matches the condition
						var condition = _.get(rule, 'details.trigger.condition',{});
						
						// all modification and case specific checks need to be moved to RuleService.
						if(condition.account)
							condition.account = parseInt(condition.account)
						
						if(condition.amount_inr)
							if(condition.type == 'income')
								condition.amount_inr = Math.abs(condition.amount_inr)
							else
								condition.amount_inr = -Math.abs(condition.amount_inr)

						condition.type = 'income_expense'
						if(condition.third_party)
							if(!created.third_party.includes(condition.third_party))
								return
							else
								delete condition.third_party

						var status = _.isMatch(created, condition);
						if(status){
							// executing action here. 
							if(rule.action=='mark_as_transfer'){
								_.merge(created,  _.get(rule, 'details.action.set',{}))
							}
						}
					});
					cb(null, created);
				})
			}],
			updatedTransaction: ['applyRule', function(results, cb){
				Transaction.update(created.id, created).exec(cb);
			}],
			predictCategory: function(cb){
				//if category present return
				if(created.category) return cb(null);
						
				MLService.predictCategory(created, cb);
			}
		}, function(err){cb(err);});
		
	},

	afterUpdate: function(updated, cb){
		//if category present return
		if(updated.category) return cb(null);
		
		MLService.predictCategory(updated, cb);
	},

	
};

