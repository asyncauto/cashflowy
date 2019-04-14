var aws = require('aws-sdk');

const kms = new aws.KMS({
	accessKeyId: sails.config.aws.key,
    secretAccessKey: sails.config.aws.secret,
    region: sails.config.aws.region
});

module.exports ={
    encrypt: async function(plaintext) {
		const params = {
			KeyId: sails.config.aws.kms_key_id, // The identifier of the CMK to use for encryption. You can use the key ID or Amazon Resource Name (ARN) of the CMK, or the name or ARN of an alias that refers to the CMK.
			Plaintext: new Buffer.from(plaintext, 'utf-8')// The data to encrypt.
		};
		var data = await kms.encrypt(params).promise();
		return data.CiphertextBlob.toString('base64');
	},
    
    /**
     * ciphertextblob base64 encoded.
     */
	decrypt: async function (ciphertextblob) {
		const params = {
			CiphertextBlob: new Buffer.from(ciphertextblob, 'base64')// The data to decrypt.
		};
		var data = await kms.decrypt(params).promise();
		return data.Plaintext.toString('utf-8');
	}
}