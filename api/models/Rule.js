/**
 * Rule.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

	attributes: {
		user: {
			model: 'user', // user id mentioned when it is a user specific rule
		},
		description:{
			type: 'string'
		},
		type:{
			type:'string',
			isIn:[
				"user","global" // helps specify if the rule is unique to a user or generic
			]
		},
		trigger:{
			type:'string',
			isIn: [
				"parsed_email_before_create",
				"transaction_after_create"
			]
		},
		action:{
			type:'string',
			isIn: [
				"modify_pe_data",
				"set_category",
				"mark_as_transfer"
			]
		},
		status:{
			type:'string',
			required: true,
			isIn:['active', 'paused', 'draft']
		},
		details: {
		  type: "json",
		  defaultsTo:{}
		},
	}
};

