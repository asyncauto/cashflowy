/**
 * Account.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

	attributes: {
		user:{
			model:'user',
			required:true
		},
		parent:{
			model:'category'
		},		
		name:{
			type:'text',
			required:true
		},
		description:{
			type:'text',
		},
		budget:{
			type:'integer'
		}
	}
};

