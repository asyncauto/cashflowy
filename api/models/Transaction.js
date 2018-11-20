/**
 * Transaction.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

	attributes: {
		original_currency:{
			type:'text',
		},
		original_amount:{
			type:'float',
		},
		amount_inr:{
			type:'float',	
		},
		occuredAt:{ // defaults to createdAt. Useful when creating manually. 
			type:'datetime'
		},
		createdBy:{
			type:'text',
			enum:['user','parsed_email', 'parsed_document']
		},
		type:{
			type:'text',
			enum:['income_expense','transfer']
		},
		description:{
			type:'text',
		},
		account:{ // from where the transaction is made
			model:'account',
			required:true
		},
		to_account:{ // only for transfers. The account to which you transferred the money to.
			model:'account',
		},
		third_party:{ // only for income/expense. 
			type:'text',
		},
		category:{
			model:'category'
		},
		tags:{
			collection:'tag',
			via:'transactions',
			dominant:true
		},

	}
};

