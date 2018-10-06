// this is the notification service.
var async = require('async');
var moment = require('moment-timezone');
module.exports={
	sendWeeklyEmailReport:function(options,callback){
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
				query+=' "transaction"."occuredAt" >\''+options.start_date.toISOString()+'\'';
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
				template:'weekly',
				to:results.getUserDetails.email,
				from:'Cashflowy<update@cashflowy.in>',
				subject:'Weekly status update'
			}
			opts.locals={
				start_date:moment(options.start_date).tz('Asia/Kolkata').format().substring(0,10),
				end_date:moment(options.end_date).tz('Asia/Kolkata').format().substring(0,10),
				name:results.getUserDetails.name,
				transactions:{
					count:results.getTransactions.length,
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
			results.getTransactions.forEach(function(t){
				if(t.amount_inr>0)
					total.income+=t.amount_inr;
				else 
					total.expense+=t.amount_inr;

				if(!t.description)
					missing.description++;
				if(!t.category)
					missing.category++;
				opts.locals.transactions.total=total;
				opts.locals.transactions.missing=missing;
			});

			// console.log(opts.locals);
			// console.log(opts.locals.transactions.spending_per_category);
			// callback(null);
			MailgunService.sendEmail(opts,function(err){
				callback(err,results)
			})
		})
	}
}