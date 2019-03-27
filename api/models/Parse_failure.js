/**
 * Parse failed 
 *
 * This is identical to parsed email in structure but contains the failed parsers.
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var async = require('async');

module.exports = {

	attributes: {
		extracted_data: {
			type: 'json',
			required: true,
		},
		email:{
			type:'string',
			isEmail: true
		},
		user: {
			model: 'user',
			required: true
		},
		message_id:{
			type:'string',
			required:true,
			unique:true,
		},
		status:{
			type: 'string',
			isIn: ['FAILED', 'PARSED']
		},
		details: {
			type: 'json',
			columnType: 'jsonb'
		},
		parsed_email: {
			model: 'parsed_email'
		}
	}
};

