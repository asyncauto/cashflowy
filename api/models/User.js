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
			type:'email',
			required:true,
			unique:true,
		},
		details:{ 
			type:'json',
			defaultsTo:{
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
		},
		toJSON: function() {
			var obj = this.toObject();
			delete obj.password;
			return obj;
		}
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

