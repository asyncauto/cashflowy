/**
 * Snapshot.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

	attributes: {
		account: {
	    	model: 'account',
	    	required:true,
		},
		type:{ // is it manually entered or is it created from transactions.
			type:'string',
			required:true,
			enum: [
				"manual_entry","from_transactions"
			]
		},
		details: {
		  type: "json",
		  defaultsTo:{}
		},
		balance:{ // the balance in an account
			type:'float', // 
			required:true
		},
		takenAt:{ // defaults to createdAt. Useful when creating manually. 
			type:'datetime'
		},
	}
};

