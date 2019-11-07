/**
 * InteractionLog.js
 *
 * @description :: All logs that is thrown by InteractionLog comes here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */


module.exports = {
	attributes: {
		log: {
			type: 'json',
			columnType: 'jsonb',
			required: true,
		},
		user: {
			model: 'user',
			// required: true
		},
		type: {
			type: 'text',
			required: true
		},
		org: {
			model: 'org',
			required: true
		},
		// what is the type of the person who is performing the action
		// difficult to decifer it from just user field. 
		doer_type:{ 
			type:'string',
			isIn: ['user', 'va','script'],
			required:true
		}
	},
};
