/**
 * Parse failed 
 *
 * This is identical to parsed email in structure but contains the failed parsers.
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
			type:'string',
		},
		user: {
			model: 'user',
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
		}
	},
};

