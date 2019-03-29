/**
 * Account.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

	attributes: {
		org:{
			model:'org', // some tags can be globally defined
			// some tags can be specific to a user, while some tags can be global. 
			// this field only need when type=user
		},
		name:{
			type:'string',
			required:true
		},
		description:{
			type:'string',
		},
		type:{
			type:'string',
			isIn:['user','global']
		},
		color:{
			type:'string',
			isIn:["red","orange","yellow","olive","green","teal","blue","violet","purple","pink","brown","grey","black"],
			defaultsTo:'teal'
		},
		tlis:{
			collection:'transaction_line_item',
			via:'tags',
		},
	}
};

