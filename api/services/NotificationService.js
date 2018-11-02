// this is the notification service.
var async = require('async');
var moment = require('moment-timezone');
module.exports={
	sendEmailReport:function(options,callback){
		options.start_date=new Date(options.start_date);
		options.end_date=new Date(options.end_date);
		async.auto({
			getUserDetails:function(callback){
				console.log('getUserDetails');
				User.findOne({id:options.user}).exec(callback);
			},
			getAccounts:function(callback){
				console.log('getAccounts');
				Account.find({user:options.user}).exec(callback);
			},
			getTransactions:['getAccounts',function(results,callback){
				var account_ids=_.map(results.getAccounts,'id');
				var filter={
					account:account_ids,
					occuredAt:{
						'>=':options.start_date,
						'<':options.end_date
					}
				}
				Transaction.find(filter).limit(1000).exec(callback);
			}],
			getCategorySpending:['getAccounts',function(results,callback){

				var escape=[];
				var query = 'select count(*),sum(amount_inr),category.name as category from transaction';
				query+=' left join category on transaction.category=category.id';
				query+=' where';
				query+=' "transaction"."type" =\'income_expense\'';
				query+=' AND "transaction"."original_amount" < 0';
				query+=' AND "transaction"."occuredAt" >\''+options.start_date.toISOString()+'\'';
				query+=' AND "transaction"."occuredAt" <\''+options.end_date.toISOString()+'\'';
				if(_.map(results.getAccounts,'id').length)
					query+=' AND account in '+GeneralService.whereIn(_.map(results.getAccounts,'id'));
				// in the accounts that belong to you
				query+=' group by category.name';
				Transaction.query(query,escape,function(err, rawResult) {
					if(err)
						callback(err);
					else
						callback(err,rawResult.rows);
				});
			}],
		},function(err,results){
			if(err)
				throw err;
			console.log('everything done');
			var opts={
				template:'monthly',
				to:results.getUserDetails.email,
				from:'Cashflowy<update@cashflowy.in>',
				subject:options.type+' status update'
			}

			opts.locals={
				start_date:moment(options.start_date).tz('Asia/Kolkata').format().substring(0,10),
				end_date:moment(options.end_date).tz('Asia/Kolkata').format().substring(0,10),
				name:results.getUserDetails.name,
				accounts:results.getAccounts,
				assets:0,
				liabilities:0,
				transactions:{

					// total:{
					// 	expense:0,
					// 	income:0,
					// },
					// missing:{
					// 	description:0,
					// 	category:0,
					// }
					spending_per_category:results.getCategorySpending,
				},
			}
			var total={
				expense:0,
				income:0,
			}
			var missing={
				description:0,
				category:0,
			}
			var count={
				expense:0,
				income:0,
				transfer:0,
				total:results.getTransactions.length,
			}
			results.getTransactions.forEach(function(t){
				if(t.type=='income_expense'){
					if(t.amount_inr>0){
						count.income++;
						total.income+=t.amount_inr;
					}
					else {
						count.expense++;
						total.expense+=t.amount_inr;
						if(!t.category)
							missing.category++;
					}
				}else{
					count.transfer++;
				}

				if(!t.description)
					missing.description++;
				opts.locals.transactions.total=total;
				opts.locals.transactions.missing=missing;
				opts.locals.transactions.count=count;
			});
			results.getAccounts.forEach(function(account){
				if(account.details.last_snapshot && account.details.last_snapshot.balance){
					if(account.details.last_snapshot.balance>0)
						opts.locals.assets+=account.details.last_snapshot.balance;
					else
						opts.locals.liabilities+=account.details.last_snapshot.balance;
				}
			})
			// console.log(opts.locals);
			// console.log(opts.locals.transactions.spending_per_category);
			// callback(null);
			MailgunService.sendEmail(opts,function(err){
				callback(err,results)
			})
		})
	},

}