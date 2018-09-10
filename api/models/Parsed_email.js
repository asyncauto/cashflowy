/**
 * Email.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var async = require('async');

module.exports = {

	attributes: {
		extracted_data: {
			type: 'json',
			required: true,
		},
		email:{
			type:'text',
		},
		user: {
			model: 'user',
			required: true
		},
		type: {
			type: 'text',
			required: true,
			// enum:[
			// 	'credit_card_alert','credit_card_statement','bank_transaction_alert','bank_statement'
			// ]
		},
		body_parser_used:{
			type:'text',

		},
		message_id:{
			type:'text',
			required:true,
			unique:true,
		},
		transaction:{ // the accociated transaction
			model:'transaction',
			// required is true, but when initially created, it is created without a ref to transaction.
		}
	},
	afterCreate: function(pe, cb) {

		// find or create transaction
		// update accociated transaction on this this table
		// console.log('parsed_email after create #1');
		async.auto({
			getAccount:function(callback){
				// console.log('parsed_email after create #2');
				Account.findOne({acc_number:pe.extracted_data.credit_card_last_4_digits}).exec(callback);
			},
			findOrCreateTransaction:['getAccount',function(results,callback){
				// console.log('parsed_email after create #3');
				const fx = require('money');
				fx.base='INR';
				fx.rates={
					'EUR':0.0125660,
					'USD':0.0146289,
					'MYR':0.0595751,
					'IDR':211.557,
					'INR':1,
					'CZK':0.320764,
					'HUF':4.03376,

				}
				var findFilter={
					createdBy:'user',
					original_currency:pe.extracted_data.currency,
					original_amount:pe.extracted_data.amount,
					// needs a bit more filtering
				};
				var t={
					original_currency:pe.extracted_data.currency,
					original_amount:-(pe.extracted_data.amount),
					amount_inr:-(fx.convert(pe.extracted_data.amount, {from: pe.extracted_data.currency, to: "INR"})),
					occuredAt: new Date(pe.extracted_data.date+' '+pe.extracted_data.time+'+5:30'),
					createdBy:'parsed_email',
					type:'income_expense',
					account:results.getAccount.id,
					third_party:pe.extracted_data.whom_you_paid
				}
				// console.log('before transaction find or create');
				Transaction.findOrCreate(findFilter,t).exec(callback);
				
			}],
			updateParsedEmail:['findOrCreateTransaction',function(results,callback){
				// console.log('parsed_email after create #4');
				Parsed_email.update({id:pe.id},{transaction:results.findOrCreateTransaction.id}).exec(callback);
			}]
		},cb)

		// Transaction.findOrCreate({},)
	}
};

