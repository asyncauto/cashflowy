// this is the notification service.
var async = require('async');
module.exports={
	sendWeeklyEmailReport:function(options,callback){
		async.auto({
			getUserDetails:function(callback){
				console.log('getUserDetails');
				User.findOne({id:options.user}).exec(callback);
			},
			getAccounts:function(callback){
				console.log('getAccounts');
				Account.find({user:options.user}).exec(callback);
			},
			getTotalExpense:['getAccounts',function(results,callback){
				var account_ids=_.map(results.getAccounts,'id');
				var filter={
					amount_inr:{
						'<':0
					},
					account:account_ids,
					occuredAt:{
						'>=':options.start_date,
						'<':options.end_date
					}
				}
				Transaction.find(filter).exec(function(err,transactions){
					var sum = 0;
					transactions.forEach(function(t){
						sum+=t.amount_inr
					})
					callback(err,sum);
				});
			}],
			getTotalIncome:['getAccounts',function(results,callback){
				var account_ids=_.map(results.getAccounts,'id');
				var filter={
					amount_inr:{
						'>':0
					},
					account:account_ids,
					occuredAt:{
						'>=':options.start_date,
						'<':options.end_date
					}
				}
				// Transaction.sum('amount_inr',filter).exec(callback);
				Transaction.find(filter).exec(function(err,transactions){
					var sum = 0;
					transactions.forEach(function(t){
						sum+=t.amount_inr
					})
					callback(err,sum);
				});
			}],
			getTransactionsWithoutDesc:['getAccounts',function(results,callback){
				var account_ids=_.map(results.getAccounts,'id');
				var filter={
					or:[
						{description:''},
						{description:null}
					],
					account:account_ids,
					occuredAt:{
						'>=':options.start_date,
						'<':options.end_date
					}
				}
				Transaction.count(filter).exec(callback);
			}],
			// getAgingSnapshots:['getAccounts',function(results,callback){
			// 	var account_ids=_.map(results.getAccounts,'id');
			// 	var filter={
			// 		or:[
			// 			{description:''},
			// 			{description:null}
			// 		],
			// 		account:account_ids,
			// 		occuredAt:{
			// 			'>=':options.start_date,
			// 			'<':options.end_date
			// 		}
			// 	}
			// 	Transaction.count(filter).exec(callback);
			// }]
		},function(err,results){
			if(err)
				throw err;
			console.log('everything done');
			var options={
				template:'weekly',
				to:results.getUserDetails.email,
				from:'Cashflowy<update@cashflowy.in>',
				subject:'Weekly status update'
			}
			options.locals={
				name:results.getUserDetails.name,
				expense_total:results.getTotalExpense,
				income_total:results.getTotalIncome,
				t_wo_d:results.getTransactionsWithoutDesc,
			}
			MailgunService.sendEmail(options,function(err){
				callback(err,results)
			})
		})
	}
}