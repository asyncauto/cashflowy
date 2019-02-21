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
	},

	beforeUpdate: function(data, cb){
		if (!data.details) return cb(null, data);
    	// merge exisiting and  upcoming details value.
		async.auto({
			getEmail: function (cb) {
				Email.findOne(data.id).exec(cb);
			},
			mergeDetails: ['getUser', function (results, cb) {
				data.details = _.merge({}, results.getEmail.details, data.details);
				cb(null);
			}]
			}, function (err, results) {
			return cb(err, data);
		})
	},
};

