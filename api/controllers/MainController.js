/**
 * MainController
 *
 * @description :: Server-side logic for managing mains
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const fs = require('fs');
const async = require('async');
const fx = require('money');
fx.base='INR';
fx.rates={
	'EUR':0.0125660,
	'USD':0.0146289,
	'MYR':0.0595751,
	'IDR':211.557,
	'INR':1,
	'CZK':0.320764,
	'HUF':4.03376,

}
module.exports = {
	landingPage:function(req,res){
		if(req.user)
			res.redirect('/dashboard');
		else 
			res.redirect('/login')
		// Cache.findOne({key:"landing_page_stats"}).exec(function(err,result){
		// 	if(err)
		// 		throw err;
			var locals={
				// stats:result.value
			}
			res.view('landingPage',locals);
		// });
	},
	listCategories:function(req,res){
		Category.find({user:req.user.id}).exec(function(err,categories){
			var locals={
				categories:categories
			}
			locals.parents=GeneralService.orderCategories(categories);
			res.view('list_categories',locals);
		});
	},
	viewCategory:function(req,res){
		res.send('this is category page');
	},
	dashboard:function(req,res){
		var month=null,year=null;
		if(req.query.month){
			year=req.query.month.substring(0,4);
			month=req.query.month.substring(5,7);
		}
		else if(req.query.year)
			year= req.query.year.substring(0,4);
		else{
			year=new Date().toISOString().substring(0,4);
			month=new Date().toISOString().substring(5,7);
		}

		async.auto({
			getAccounts:function(callback){
				Account.find({user:req.user.id}).sort('updatedAt DESC').exec(callback);
			},
			getCategories:function(callback){
				Category.find({user:req.user.id}).exec(callback);
			},
			getCategorySpending:function(callback){

				var escape=[year];
				var query = 'select count(*),sum(amount_inr),category from transaction';
				query+=' where';
				query+=' EXTRACT(YEAR FROM "occuredAt") = $1';
				if(month){
					escape.push(month);
					query+=' AND EXTRACT(MONTH FROM "occuredAt") = $2';
				}
				query+=' group by category';
				Transaction.query(query,escape,function(err, rawResult) {
					if(err)
						callback(err);
					else
						callback(err,rawResult.rows);
				});
			},
			getExpenseChartData:function(callback){
				var escape=[year];
				var query = 'select count(*),sum(amount_inr),EXTRACT(Day from "occuredAt") as day from transaction';
				query+=' where';
				query+=' EXTRACT(YEAR FROM "occuredAt") = $1';
				if(month){
					escape.push(month);
					query+=' AND EXTRACT(MONTH FROM "occuredAt") = $2';
				}
				query+=' group by day';
				query+=' order by day';
				Transaction.query(query,escape,function(err, rawResult) {
					if(err)
						callback(err);
					else
						callback(err,rawResult.rows);
				});
			}
		},function(err,results){
			console.log('\n\n\n====err');
			console.log(err);
			results.getCategories.forEach(function(cat){
				cat.t_count=0;
				cat.t_sum=0;
				console.log(results.getCategorySpending);
				results.getCategorySpending.forEach(function(spend){
					if(cat.id==spend.category){
						cat.t_count=spend.count;
						cat.t_sum=spend.sum;
					}
				})
				// console.log(cat);
			});

			var locals={
				current:year+'-'+month,
				accounts:results.getAccounts,
				categories:GeneralService.orderCategories(results.getCategories),
			}
			if(month==1)
				locals.prev=(parseInt(year)-1)+'-12';
			else
				locals.prev=year+'-'+(parseInt(month)-1)

			if(month==12)
				locals.next=(parseInt(year)+1)+'-1'
			else
				locals.next=year+'-'+(parseInt(month)+1);



			// console.log(locals.next);
			// console.log(locals.prev);
			
			locals.chart={
				x:[],
				y:[]
			}
			var i=1;
			results.getExpenseChartData.forEach(function(row){
				for(;i<row.day;i++){
					locals.chart.x.push(i);
					locals.chart.y.push(0);
				}
				locals.chart.x.push(row.day);
				locals.chart.y.push(-row.sum);
				i++;
			});
			// locals.chart.x.forEach()
			console.log(locals.chart);


			res.view('dashboard',locals);
		})

	},
	// test:function(req,res){
	// 	console.log('hi hi');
	// 	// for each user, 
	// 	// for each gmail filter
	// 	var icici_filter= require('../filters/IciciCreditCardTransactionAlertFilter.js');
	// 	// console.log(icici_filter);
	// 	var options={
	// 		q:icici_filter.gmail_filter,
	// 		pageToken:req.query.pageToken?req.query.pageToken:null,
	// 	}
	// 	async.auto({
 //            getMessages: function (callback) {
 //                GmailService.getMessages(options,callback);
 //            },
 //            processEachMessage: ['getMessages', function (results, callback) {
 //            	console.log('inside processEachMessage');
 //            	var count=0;
 //            	async.eachLimit(results.getMessages.messages,1,function(m,next){
 //            		console.log(count);
 //            		count++;
 //            		console.log("\n\n\n====== m_id="+m.id);
 //            		GmailService.getMessageDetails(m.id,function(err,data){
 //            			var log={
 //            				user:1,
 //            				log_type:'credit_card_alert',
 //            				medium:'email',
 //            				extracted_data:data,
 //            				email:'alexjv89@gmail.com',
 //            				message_id:m.id
 //            			}
 //            			console.log(data);
 //            			// next(err);
 //            			Email.findOrCreate({message_id:m.id},log).exec(function(err,result){
 //            				console.log(err);
 //            				next(err);
 //            			});
 //            		});
 //            		// next(null);
 //            		// get message details
 //            		// extract data
 //            		// create or update processed message
 //            	},function(err){
 //            		callback(null);
 //            		console.log('everything done');
 //            	})
 //                // results.getMessages.forEach()
 //            }]
 //        }, function (err, results) {
 //            if (err)
 //                return res.json(500, { status: 'failure', error: err.message });
 //            return res.json({ status: 'success',getMessages:results.getMessages})
 //        })
	// 	// GmailService.listMessages(options,function(err,results){
	// 	// 	res.send(results);
	// 	// });
	// 	// list messages
	// 	// get body of each of the message
	// 	// process the message
	// },
	test2:function(req,res){
        var email_type=req.query.email_type?req.query.email_type:'IciciCreditCardTransactionAlertFilter';
		
		if(!req.query.email_id)
			return res.send('email id missing in query parameters');
		async.auto({
			getEmailToken:function(callback){
				Email.findOne({id:req.query.email_id}).exec(function(err,email){
					callback(err,email.token);
				});
			},
            getMessages:['getEmailToken',function (results,callback) {
            	var extract_config= require('../filters/'+email_type+'.js');
            	// console.log(icici_filter);
            	var options={
            		q:extract_config.gmail_filter,
            		pageToken:req.query.pageToken?req.query.pageToken:null,
            		email_token:results.getEmailToken,
            	}
                GmailService.getMessages(options,callback);
            }],
            processEachMessage: ['getMessages', function (results, callback) {
            	console.log('inside processEachMessage');
            	var count=0;
            	async.eachLimit(results.getMessages.messages,1,function(m,next){
            		console.log("\n\n\n====== m_id="+m.id);
            		console.log(count);
            		count++;
					async.auto({
            			getMessageBody:function(callback){
            				var options={
            					message_id:m.id
            				}
            				GmailService.getMessageBody(options,callback);
            			},
            			extractDataFromMessageBody:['getMessageBody',function(results,callback){
            				var options={
            					email_type:email_type,
            					body:results.getMessageBody
            				}
            				GmailService.extractDataFromMessageBody(options,callback);
            			}],
            			findOrCreateEmail:['extractDataFromMessageBody',function(results,callback){
            				// console.log('\n\n\nin findOrCreateEmail');
            				// console.log(results.extractDataFromMessageBody);
            				var email={
            					extracted_data:results.extractDataFromMessageBody.ed,
            					user:1,
            					type:email_type,
            					body_parser_used:results.extractDataFromMessageBody.body_parser_used,
            					email:'alexjv89@gmail.com',
            					message_id:m.id
            				}
            				Parsed_email.findOrCreate({message_id:m.id},email).exec(callback);
            			}]
            		},next)


            	},function(err){
            		callback(null);
            		console.log('everything done');
            	})
                // results.getMessages.forEach()
            }]
        }, function (err, results) {
            if (err)
                return res.json(500, { status: 'failure', error: err.message });
            return res.json({ status: 'success',getMessages:results.getMessages})
        })
	},
	viewTransactions:function(req,res){
		var locals={};
		// getUserEmailIds:function
		async.auto({
			getAccounts:function(callback){
				Account.find({user:req.user.id}).exec(callback);
			},
			getTransactions:['getAccounts',function(results,callback){
				var accounts=[];
				results.getAccounts.forEach(function(account){
					accounts.push(account.id);
				});
				Transaction.find({account:accounts}).sort('occuredAt DESC').exec(callback);
			}],
			
		},function(err,results){
			locals.transactions=results.getTransactions;
			var accounts=results.getAccounts;
			locals.transactions.forEach(function(t){
				accounts.forEach(function(account){
					if(t.account==account.id)
						t.account=account;
				});
			})
			// res.send(locals);
			res.view('view_transactions',locals);
			
		});
		
	},
	debug:function(req,res){
		var email_type=req.query.email_type?req.query.email_type:'IciciCreditCardTransactionAlertFilter'
		var message_id=req.query.message_id;
		var options={
			email_type:req.query.email_type,
			message_id:message_id
		}
		async.auto({
			getMessageBody:function(callback){
				var options={
					message_id:message_id
				}
				GmailService.getMessageBody(options,callback);
			},
			extractDataFromMessageBody:['getMessageBody',function(results,callback){
				var options={
					email_type:email_type,
					body:results.getMessageBody
				}
				GmailService.extractDataFromMessageBody(options,callback);
			}]
		},function(err,results){
			res.send(results);
		})

		// GmailService.getMessageDetails(options,function(err,data){
		// 	var log={
		// 		user:1,
		// 		log_type:'credit_card_alert',
		// 		medium:'email',
		// 		extracted_data:data,
		// 		email:'alexjv89@gmail.com',
		// 		message_id:message_id
		// 	}
		// 	console.log(data);
		// 	res.send(data);
		// });
	},
	editDescription:function(req,res){
		// do you have permission to edit description of that transaction?
		async.auto({
			getAccounts:function(callback){
				Account.find({user:req.user.id}).exec(callback);
			},
			getTransactionDetails:function(callback){
				Transaction.findOne({id:req.body.t}).exec(callback);
			},
		},function(err,results){
			if(err)
				throw err;
			var t = results.getTransactionDetails;
			var flag=false;
			results.getAccounts.forEach(function(account){
				if(t.account==account.id) // transaction in account of the user
					flag=true;
			});
			if(flag){
				Transaction.update({id:t.id},{description:req.body.description}).exec(function(err,result){
					if(err)
						throw err;
					else
						res.send('ok');
				})
			}else{
				res.send(400,'you cant edit that transaction');
			}
		})
	}
};


//

