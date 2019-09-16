/**
 * Email.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var async = require('async');

module.exports = {

	attributes: {
		transaction_event:{
			type:'json',
		},
		similar_transaction_events:{
			type:'json',
		},
		sli:{
			model:'statement_line_item',
		},
		parsed_email:{
			model:'parsed_email',
		},
		details: { // additional stuff that you want to add
			type: 'json',
			defaultsTo:{}
		},
	},
};

