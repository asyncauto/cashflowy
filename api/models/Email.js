/**
 * Email.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

	attributes: {
		
		email:{
			type:'text',
		},
		user: {
			model: 'user',
			required: true
		},
		token: {
			type: 'json',
		},
		details:{
			type: 'json',
		},
	}
};

