/**
 * Account.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

	attributes: {
		org:{
			model:'org',
			required:true
		},	
		name:{
			type:'string',
			required:true
		},
		type:{
			type:'string',
			defaultsTo:'single_pnl_head'
		},
		details:{ 
			type:'json',
			defaultsTo:{}
		},
	}
};

