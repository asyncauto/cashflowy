var async = require('async');
module.exports={
	/**
	 * this calculates unaccounted money in a particular snapshot
	 * Options needs to contain the following:
	 * - snapshot - snapshot id or snapshot object
	 */
	calculateUnaccountedMoney:function(snapshot,callback){
		async.auto({
			getSnapshot:function(callback){
				if(typeof snapshot=='object')
					callback(null,snapshot);
				else
					Snapshot.findOne({id:snapshot}).exec(callback);
			},
			getPreviousSnapshot:['getSnapshot',function(results,callback){
				var filter={
					account:results.getSnapshot.account,
					takenAt:{'<':results.getSnapshot.takenAt},
				}
				var escape=[];
				var query = 'select * from snapshot';
				query+=' where';
				query+=` "takenAt"<'${results.getSnapshot.takenAt.toISOString()}'`;
				query+=` AND account ='${results.getSnapshot.account}'`;
				query+=' ORDER BY "takenAt" DESC';
				query+=' LIMIT 1';
				// console.log('\n\n\n\n '+query);
				// callback(null);
				Snapshot.query(query,escape,function(err, rawResult) {
					// console.log('\n\n\n\n');
					// console.log(results.getSnapshot);
					// console.log('\n\n\n\n')
					// console.log(rawResult.rows[0])
					var prev_snap = rawResult.rows[0];
					if(err)
						callback(err);
					else
						if(!prev_snap)
							return callback('no prev_snapshot');
						else
							return callback(err,prev_snap);
				});
			}],
			getTransactions:['getPreviousSnapshot',function(results,callback){
				var escape=[];
				var query = 'select * from transaction';
				query+=' where';
				query+=` "occuredAt">'${results.getPreviousSnapshot.takenAt.toISOString()}'`;
				query+=` AND "occuredAt"<='${results.getSnapshot.takenAt.toISOString()}'`;
				query+=` AND account ='${results.getSnapshot.account}'`;
				// console.log('\n\n\n\n '+query);
				// callback(null);
				Transaction.query(query,escape,function(err, rawResult) {
					// console.log(rawResult.rows)
					if(err)
						callback(err);
					else
						callback(err,rawResult.rows);
				});
			}],
			calculateAndUpdateSnapshot:['getTransactions',function(results,callback){
				var uam=0;
				// s1+t+uam=s2;
				// uam = negative - some payments are missing
				// uam = positive - some gains are missing
				var s1 = results.getPreviousSnapshot.balance;
				var s2 = results.getSnapshot.balance;
				var sum = 0;
				results.getTransactions.forEach(function(t){
					sum+=t.amount_inr;
				});

				uam = Math.round(s2 - s1 - sum);
				// console.log(results.getSnapshot.id,results.getPreviousSnapshot.id);
				console.log(s1,s2,sum,uam,results.getTransactions.length);
				// callback(null,uam);
				var snapshot=results.getSnapshot;
				if(!snapshot.details)
					snapshot.details={};
				snapshot.details.uam={
					value:uam,
					transactions:results.getTransactions.length,
				};
				Snapshot.update({id:snapshot.id},{details:snapshot.details}).exec(callback);
			}],
		},function(err,results){
			// just skip processing snapshot that does not have a prev snapshot.
			if(err=='no prev_snapshot') 
				err=null;
			callback(err,results);
		})
	},
	/**
	 * calculate uam for a number of snapshots based on options
	 * options can be:
	 * - user: optional
	 * - account: optional
	 * - snapshots: optional
	 */
	calculateUAM:function(options,callback){
		
		var calculateUAMForEachSnapshot=function(snapshots,cb){
			async.eachLimit(snapshots,1,function(s,next){
				BackgroundService.calculateUnaccountedMoney(s,next);
			},function(err){
				cb(err);
			})
		}

		// console.log('\n\n\n\n');
		// console.log(options);
		if(options.user){
			Account.find({user:options.user}).exec(function(err,accounts){
				var acc_ids=_.map(accounts,'id');
				Snapshot.find({account:acc_ids}).sort('takenAt DESC').exec(function(err,snapshots){
					calculateUAMForEachSnapshot(snapshots,callback);
				});
			});
		}else if(options.account){
			Snapshot.find({account:options.account}).sort('takenAt DESC').exec(function(err,snapshots){
				calculateUAMForEachSnapshot(snapshots,callback);
			});
		}else if(options.snapshots){
			Snapshot.find({id:options.snapshots}).sort('takenAt DESC').exec(function(err,snapshots){
				calculateUAMForEachSnapshot(snapshots,callback);
			});
		}
	}
}