/**
 * Account.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

	attributes: {
		user:{
			model:'user', // some tags can be globally defined
			// some tags can be specific to a user, while some tags can be global. 
			// this field only need when type=user
		},
		name:{
			type:'text',
			required:true
		},
		description:{
			type:'text',
		},
		type:{
			type:'text',
			enum:['user','global']
		}
	}
};

