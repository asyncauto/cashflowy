var async = require('async');

var Bull = require( 'bull' );
	// create our job queue
var queue = new Bull('queue',{redis:sails.config.bull.redis});

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
				sails.sendNativeQuery(query,escape,function(err, rawResult) {
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
			getIEs:['getPreviousSnapshot',function(results,callback){
				var escape=[];
				var query = 'select * from transaction';
				query+=' where';
				query+=` "occuredAt">'${results.getPreviousSnapshot.takenAt.toISOString()}'`;
				query+=` AND "occuredAt"<='${results.getSnapshot.takenAt.toISOString()}'`;
				query+=` AND account ='${results.getSnapshot.account}'`;
				query+=` AND type ='income_expense'`;
				// console.log('\n\n\n\n '+query);
				// callback(null);
				sails.sendNativeQuery(query,escape,function(err, rawResult) {
					// console.log(rawResult.rows)
					if(err)
						callback(err);
					else
						callback(err,rawResult.rows);
				});
			}],
			getTransfers:['getPreviousSnapshot',function(results,callback){
				var escape=[];
				var query = 'select * from transaction';
				query+=' where';
				query+=` "occuredAt">'${results.getPreviousSnapshot.takenAt.toISOString()}'`;
				query+=` AND "occuredAt"<='${results.getSnapshot.takenAt.toISOString()}'`;
				query+=` AND (account ='${results.getSnapshot.account}' OR to_account ='${results.getSnapshot.account}')`;
				query+=` AND type ='transfer'`;
				// console.log('\n\n\n\n '+query);
				// callback(null);
				sails.sendNativeQuery(query,escape,function(err, rawResult) {
					// console.log(rawResult.rows)
					if(err)
						callback(err);
					else
						callback(err,rawResult.rows);
				});
			}],
			
			calculateAndUpdateSnapshot:['getIEs','getTransfers',function(results,callback){
				var uam=0;
				// s1+t+uam=s2;
				// uam = negative - some payments are missing
				// uam = positive - some gains are missing
				var s1 = results.getPreviousSnapshot.balance;
				var s2 = results.getSnapshot.balance;
				var sum = 0;
				results.getIEs.forEach(function(t){
					sum+=t.amount_inr;
				});
				results.getTransfers.forEach(function(t){
					if(t.account==results.getSnapshot.account)
						sum+=t.amount_inr;
					else if(t.to_account==results.getSnapshot.account)
						sum-=t.amount_inr;
				});
				uam = Math.round(s2 - s1 - sum);
				// console.log(results.getSnapshot.id,results.getPreviousSnapshot.id);
				console.log(s1,s2,sum,uam,results.getIEs.length);
				// callback(null,uam);
				var snapshot=results.getSnapshot;
				if(!snapshot.details)
					snapshot.details={};
				snapshot.details.uam={
					value:uam,
					IEs:results.getIEs.length,
					transfers:results.getTransfers.length,
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
		if(options.org){
			Account.find({org:options.org}).exec(function(err,accounts){
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
	},

	/**
	 * filter: exmple: {user:id}
	 */
	surfaceCrawl: function(filter, callback){
		async.auto({
			getEmails: function(cb){
				Email.find(filter).exec(cb);
			},
			addToBull:['getEmails', function(results, cb){
				var tasks=[];
				sails.config.filters.active.forEach(function(filter){
					results.getEmails.forEach(function(email){
						var data={
							title:'surface_crawl, email ='+email.id+', filter='+filter,
							options:{ // this is used
								email_id:email.id,
								email_type:filter,
								pageToken:null,
							},
							info:{ // this is for readability
								user:filter.user ? filter.user:''
							}
						}
						tasks.push(data);
					});
				});
				async.eachLimit(tasks,1,function(data,next){
					var promise = queue.add('surface_crawl',data);
					GeneralService.p2c(promise,next);
				},function(err){
					cb(err,tasks);
				})
			}]
		}, callback);
	},

	sendWeeklyEmails: function(filter, callback){
		// get all users 
		// subtract disabled users - Mayank
		// identify the right week
		// add to quey
		var prevMonday = new Date();
		prevMonday.setDate(prevMonday.getDate() - (prevMonday.getDay() + 6) % 7);
		prevMonday=moment(prevMonday).tz('Asia/Kolkata').format();
		var end = new Date(prevMonday.substring(0,10)+'T00:00:00.000+0530');
		var start = new Date(end);
		start.setDate(start.getDate()-7);
		// '2018-09-24T00:00:00.000+0530'
		User.find(filter).exec(function(err,users){
			var bull_configs=[];
			users.forEach(function(user){
				var data={
					title:'Send weekly email to '+user.name,
					options:{
						start_date:start,
						end_date:end,
						user:user.id,
						type:'Weekly'
					},
					info:{}
				};
				bull_configs.push(data);
			})
			async.eachLimit(bull_configs,1,function(data,next){
				var promise = queue.add('send_email_report',data);
				GeneralService.p2c(promise,next);
			}, callback);
		});
	},

	sendMonthlyEmails: function(filter, callback){
		var temp = new Date();
		temp.setDate(1);
		temp=moment(temp).tz('Asia/Kolkata').format();
		var end = new Date(temp.substring(0,10)+'T00:00:00.000+0530');
		var start = new Date(end);
		start.setDate(-5);
		start.setDate(1);
		User.find(filter).exec(function(err,users){
			var bull_configs=[];
			users.forEach(function(user){
				var data={
					title:'Send monthly email to '+user.name,
					options:{
						start_date:start,
						end_date:end,
						user:user.id,
						type:'Monthly'
					},
					info:{}
				};
				bull_configs.push(data);
			})
			async.eachLimit(bull_configs,1,function(data,next){
				var promise = queue.add('send_email_report',data);
				GeneralService.p2c(promise,next);
			}, callback);
		});
	},

	deleteBullTasks: function(grace, state){
		var state = state ? state:'completed';
		var grace = grace ? grace :10000; // 10 sec ago
		queue.clean(grace,state);
		console.log(`cleaning all jobs that ${state} over ${grace/1000} seconds ago.`);
	}
}