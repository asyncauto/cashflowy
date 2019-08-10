/**
 * Account.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

	attributes: {
		org: {
	    	model: 'org',
	    	required:true,
		},
		type:{
			type:'string',
			required:true,
			isIn: [
				"bank","credit_card","cash","wallet","investment"
			]
		},
		details: {
		  type: "json",
		  defaultsTo:{}
		},
		name:{
			type:'string',
			required:true
		},
		acc_number:{ // credit card last 4 digits or bank acc number
			type:'string', // 
			required:true
		},
		statements:{
			collection:'statement',
			via:'accounts',
			dominant:true
		},
	}
};

