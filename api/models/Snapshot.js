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
			type:'string',
			isIn:['user','parsed_email']
		},
		details: {
		  type: "json",
		  defaultsTo:{}
		},
		balance:{ // the balance in an account
			type:'number', // 
			required:true,
			columnType: 'float4'
		},
		takenAt:{ // defaults to createdAt. Useful when creating manually. 
			type:'string',
			columnType:'timestamptz'
		},
	},
	afterCreate:function(snapshot,cb){
		// after creating the snapshot, update the cache in accounts table.
		Account.findOne({id:snapshot.account}).exec(function(err,acc){
			var details = {};
			if(acc.details)
				details=acc.details;
			if(!details.last_snapshot) // if last_snapshot does not exist
				details.last_snapshot=snapshot;
			else if(new Date(snapshot.takenAt) > new Date(details.last_snapshot.takenAt)) 
				details.last_snapshot=snapshot; // if the recently created snapshot is more recent then update
			Account.update({id:snapshot.account},{details:details}).exec(cb);
		})
	}
};

