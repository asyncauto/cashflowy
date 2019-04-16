var aws = require('aws-sdk');

const kms = new aws.KMS({
	accessKeyId: sails.config.aws.key,
	secretAccessKey: sails.config.aws.secret,
	region: sails.config.aws.region
});

module.exports = {
	kms: kms,
	encrypt: function (plaintext, cb) {
		const params = {
			KeyId: sails.config.aws.kms_key_id, // The identifier of the CMK to use for encryption. You can use the key ID or Amazon Resource Name (ARN) of the CMK, or the name or ARN of an alias that refers to the CMK.
			Plaintext: new Buffer.from(plaintext, 'utf-8')// The data to encrypt.
		};
		kms.encrypt(params, function (err, data) {
			if (err)
				return cb(err);
			return cb(null, data.CiphertextBlob.toString('base64'))
		});
	},

    /**
     * ciphertextblob base64 encoded.
     */
	decrypt: function (ciphertextblob, cb) {
		const params = {
			CiphertextBlob: new Buffer.from(ciphertextblob, 'base64')// The data to decrypt.
		};
		kms.decrypt(params, function (err, data) {
			if (err)
				return cb(err);
			return cb(null, data.Plaintext.toString('utf-8'))
		});
	}
}