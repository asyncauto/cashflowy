/**
 * Account.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

	attributes: {
		user: {
	    	model: 'user',
	    	required:true,
		},
		type:{
			type:'string',
			required:true,
			enum: [
				"bank","credit_card","cash","wallet","investment"
			]
		},
		details: {
		  type: "json",
		  defaultsTo:{}
		},
		name:{
			type:'text',
			required:true
		},
		acc_number:{ // credit card last 4 digits or bank acc number
			type:'text', // 
			required:true
		},
		docs:{
			collection:'document',
			via:'accounts',
			dominant:true
		},
	}
};

