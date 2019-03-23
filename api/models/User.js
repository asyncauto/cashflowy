/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var bcrypt = require('bcryptjs');
module.exports = {

	attributes: {
		name:{
			type:'string',
			required:true,
		},
		email:{
			type:'string',
			required:true,
			unique:true,
			isEmail: true
		},
		details:{ 
			type:'json',
			defaultsTo:{
				"timezone_offset":-330,
				"default_currency":"INR"
			}
		},
		password:{
			type:'string',
			required:true,
		},
		rawlogs: {
			collection: 'rawlog',
			via: 'user',
		},
		processed_emails: {
			collection: 'email',
			via: 'user',
		}
	},
	
	customToJSON: function() {
		var obj = this;
		delete obj.password;
		return obj;
	},

	beforeUpdate: function(data, cb){
		if (!data.details) return cb(null, data);
    	// merge exisiting and  upcoming details value.
		async.auto({
			getUser: function (cb) {
				User.findOne(data.id).exec(cb);
			},
			mergeDetails: ['getUser', function (results, cb) {
				data.details = _.merge({}, results.getUser.details, data.details);
				cb(null);
			}]
			}, function (err, results) {
			return cb(err, data);
		})
	},

	beforeCreate: function(user, cb) {
		bcrypt.genSalt(10, function(err, salt) {
			bcrypt.hash(user.password, salt, function(err, hash) {
				if (err) {
					console.log(err);
					cb(err);
				}else{
					user.password = hash;
					cb(null, user);
				}
			});
		});
	}
};

