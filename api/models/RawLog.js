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
		user: {
			model: 'user',
			required: true
		},
		log_type: {
			type: 'text',
			required: true,
			enum:[
				'credit_card_alert','credit_card_statement','bank_transaction_alert','bank_statement'
			]
		},
		medium: {
			type: 'text',
			required: true,
			enum:[
				'email',
			]
		},		
	}
};

