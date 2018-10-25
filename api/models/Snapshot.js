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
		createdBy:{
			type:'text',
			enum:['user','parsed_email']
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
	},
	afterCreate:function(snapshot,cb){
		// after creating the snapshot, update the cache in accounts table.
		Account.findOne({id:snapshot.account}).exec(function(err,acc){
			var details = {};
			if(acc.details)
				details=acc.details;
			details.last_snapshot=snapshot;
			Account.update({id:snapshot.account},{details:details}).exec(cb);
		})
	}
};

