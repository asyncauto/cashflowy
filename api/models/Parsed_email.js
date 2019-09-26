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
		data: { // the processed version of extracted data. This can be modified by automation
			type: 'json',
			// required: true,	
		},
		email: {
			type: 'string',
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
		body_parser_used: {
			type: 'string',

		},
		message_id: {
			type: 'string',
			required: true,
			unique: true,
		},
		transaction_event: { // the accociated transaction
			model: 'transaction_event',
			// required is true, but when initially created, it is created without a ref to transaction.
		},
		details: {
			type: 'json',
			columnType: 'jsonb'
		}
	},
	beforeCreate: function (pe, cb) {
		// apply before modifier
		sails.config.emailparser.beforeModifyData(pe);
		// apply particular filter
		var filter = _.find(sails.config.emailparser.filters, { name: pe.type });
		if (filter.modifyData)
			filter.modifyData(pe);
		// apply after modifier
		sails.config.emailparser.afterModifyData(pe);

		// apply rules
		Rule.find({ org: pe.org, status: 'active', trigger: 'parsed_email_before_create' }).exec(function (err, rules) {
			rules.forEach(function (rule) {
				// check if criteria matches the condition
				var status = _.isMatch(pe, _.get(rule, 'details.trigger.condition', {}));
				if (status) {
					// executing action here. 
					if (rule.action == 'modify_pe_data') {
						_.merge(pe, _.get(rule, 'details.action.set', {}))
					}
				}
			});
			cb(null);
		})
	},
	afterCreate: function (pe, calllback) {
		CashflowyService.afterCreate_PE(pe, calllback);
	},
	afterUpdate: async function(pe, calllback){
		//exit if dtes exists
		var dtes = await Doubtful_transaction_event.find({parsed_email: pe.id})
		if(dtes.length) return calllback(null);

		//run after create functionality if transaction_event is not created.
		if(!pe.transaction_event)
			CashflowyService.afterCreate_PE(pe, calllback);
		else 
			calllback(null);
	}
};

