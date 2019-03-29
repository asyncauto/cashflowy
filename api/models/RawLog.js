/**
 * RawLog.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

	attributes: {
		log: {
			type: 'json',
			required: true,
		},
		org: {
			model: 'org',
			required: true
		},
		log_type: {
			type: 'string',
			required: true,
			isIn:[
				'credit_card_alert','credit_card_statement','bank_transaction_alert','bank_statement'
			]
		},
		medium: {
			type: 'string',
			required: true,
			isIn:[
				'email',
			]
		},		
	}
};

