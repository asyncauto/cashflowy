/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var bcrypt = require('bcryptjs');
var aws = require('aws-sdk');
var jwt = require('jsonwebtoken');

const kms = new aws.KMS({
	accessKeyId: sails.config.aws.key,
	secretAccessKey: sails.config.aws.secret,
	region: sails.config.aws.region
});

module.exports = {

	attributes: {
		name: {
			type: 'string',
			required: true,
		},
		email: {
			type: 'string',
			required: true,
			unique: true,
			isEmail: true
		},
		details: {
			type: 'json',
			defaultsTo: {
				"timezone_offset": -330,
				"default_currency": "INR"
			}
		},
		password: {
			type: 'string',
			required: true,
		},
		api_token: {
			type: 'string',
			unique: true,
			allowNull: true
		}
	},

	customToJSON: function () {
		var obj = this;
		delete obj.password;
		delete obj.api_token;
		return obj;
	},

	beforeUpdate: async function (data, cb) {
		if (data.api_token)
			var encrypt_data = await kms.encrypt({
				KeyId: sails.config.aws.kms_key_id,
				Plaintext: new Buffer.from(data.api_token, 'utf-8')
			}).promise()
		data.api_token = encrypt_data.CiphertextBlob.toString('base64');

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

	beforeCreate: async function (user, cb) {
		bcrypt.genSalt(10, function (err, salt) {
			bcrypt.hash(user.password, salt, function (err, hash) {
				if (err) {
					console.log(err);
					cb(err);
				} else {
					user.password = hash;
					cb(null, user);
				}
			});
		});
	},

	afterCreate: async function (user, cb) {
		//generate a plain jwt token
		user.api_token = jwt.sign({id:user.id},sails.config.api_token_secret);
		//encrypt it before storeing
		var encrypt_data = await kms.encrypt({
			KeyId: sails.config.aws.kms_key_id,
			Plaintext: new Buffer.from(user.api_token, 'utf-8')
		}).promise()
		user.api_token = encrypt_data.CiphertextBlob.toString('base64');

		// create a personal organization
		var org = await Org.create({
			name: user.name,
			type: 'personal',
			owner: user.id,
			details: {
				"default_account": user.id,
				"timezone_offset": -330,
				"default_currency": "INR"
			}
		});
		
		return cb()
	}
};

