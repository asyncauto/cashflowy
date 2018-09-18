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
	listEmails:function(req,res){
		Email.find({user:req.user.id}).exec(function(err,emails){
			var locals={
				emails:emails
			}
			res.view('list_emails',locals);
		});
	},
	createEmail:function(req,res){
		if(req.body){ // post request
			
		}else{ // view the form
			var locals={
				email:'',
				token:'',
				status:'',
				message:'',
			}
			console.log(locals);
			res.view('create_email',locals);
		}

	},
	editEmail:function(req,res){

	},
	viewEmail:function(req,res){

	},
	createAccount:function(req,res){

	},
	listAccounts:function(req,res){
		Account.find({user:req.user.id}).exec(function(err,accounts){
			var locals={
				accounts:accounts
			}
			res.view('list_accounts',locals);
		})
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
				// in the accounts that belong to you
				query+=' group by category';
				Transaction.query(query,escape,function(err, rawResult) {
					if(err)
						callback(err);
					else
						callback(err,rawResult.rows);
				});
			},
			getSnapshots:function(callback){
				var escape=[year];
				var query = 'select *,EXTRACT(Day from "takenAt") as day from snapshot';
				query+=' where';
				query+=' EXTRACT(YEAR FROM "takenAt") = $1';
				if(month){
					escape.push(month);
					query+=' AND EXTRACT(MONTH FROM "takenAt") = $2';
				}
				// where accounts in the accounts that belong to you
				Snapshot.query(query,escape,function(err, rawResult) {
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
			locals.snapshots=results.getSnapshots;
			locals.chart2={
				x:locals.chart.x,
				datasets:[],
			};
			results.getAccounts.forEach(function(account,i){
				var colors = ['teal','blue','red','green','violet','orange','black','brown'];
				var dataset ={
	                label: account.name,
	                backgroundColor: colors[i],
	                borderColor: colors[i],
	                data: [],
	                fill: false,
	            }
	            locals.chart2.x.forEach(function(day){
	            	var y = 0;
	            	locals.snapshots.forEach(function(snapshot){
	            		if(snapshot.account==account.id && snapshot.day==day)
	            			y=snapshot.balance;
	            	});
	            	dataset.data.push(y);
	            })
				locals.chart2.datasets.push(dataset);
			})
			// res.send(locals);
			res.view('dashboard',locals);
		})

	},
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
							if(email.body_parser_used==''){
								console.log('\n\n\nbody parser is null');
								console.log(email);
							}
							// during testing a new filter, comment/uncomment the following lines
							// console.log(email);
							// callback(null);
							Parsed_email.findOrCreate({message_id:m.id},email).exec(callback);
							// Parsed_email.findOrCreate({message_id:m.id},email).exec(function(err,result){
							// 	callback('manual error');
							// });
            			}]
            		},next)


            	},function(err){
					if(err)
						throw err;
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
	listTransactions:function(req,res){
		
		var locals={};
		// getUserEmailIds:function
		var limit = req.query.limit?req.query.limit:100;
		async.auto({
			getAccounts:function(callback){
				Account.find({user:req.user.id}).exec(callback);
			},
			getTransactions:['getAccounts',function(results,callback){
				var accounts=[];
				results.getAccounts.forEach(function(account){
					accounts.push(account.id);
				});
				Transaction.find({account:accounts}).sort('occuredAt DESC').limit(limit).exec(callback);
			}],
			getCategories:function(callback){
				Category.find({user:req.user.id}).exec(callback);
			}
		},function(err,results){
			locals.transactions=results.getTransactions;
			var accounts=results.getAccounts;
			locals.transactions.forEach(function(t){
				accounts.forEach(function(account){ // expanding account in the transaction object
					if(t.account==account.id)
						t.account=account;
				});
				var moment = require('moment-timezone');
				t.occuredAt=moment(t.occuredAt).tz('Asia/Kolkata').format();
			})
			// locals.categories=GeneralService.orderCategories(results.getCategories);
			locals.categories=results.getCategories;
			locals.moment=require('moment-timezone');
			res.view('view_transactions',locals);
			
		});
	},
	createTransaction:function(req,res){
		Account.find({user:req.user.id}).exec(function(err,accounts){
			if(req.body){ // post request
				console.log(req.body);
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
				var findFilter={
					createdBy:'user',
					original_currency:req.body.original_currency,
					original_amount:-(req.body.original_amount),
					// needs a bit more filtering
				};
				var t={
					original_currency:req.body.original_currency,
					original_amount:-(req.body.original_amount),
					amount_inr:-(fx.convert(req.body.original_amount, {from: req.body.original_currency, to: "INR"})),
					occuredAt: new Date(req.body.date+' '+req.body.time+req.body.tz),
					createdBy:'user',
					type:'income_expense',
					description:req.body.description,
					account:req.body.account_id,
					third_party:req.body.third_party
				}
				// console.log('before transaction find or create');
				console.log(t);
				Transaction.create(t).exec(function(err,transaction){
					if(err)
						throw err;
					else
						res.redirect('/transactions');
				});
			}else{ // view the form
				var locals={
					email:'',
					token:'',
					status:'',
					message:'',
					description:'',
					original_amount:'',
					original_currency:'',
					third_party:'',
					account_id:'',
					accounts:accounts
				}
				console.log(locals);
				res.view('create_transaction',locals);
			}
		})
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
	},
	listSnapshots:function(req,res){
		
		var locals={};
		// getUserEmailIds:function
		var limit = req.query.limit?req.query.limit:100;
		async.auto({
			getAccounts:function(callback){
				Account.find({user:req.user.id}).exec(callback);
			},
			getSnapshots:['getAccounts',function(results,callback){
				var accounts=[];
				results.getAccounts.forEach(function(account){
					accounts.push(account.id);
				});
				Snapshot.find({account:accounts}).sort('takenAt DESC').limit(limit).exec(callback);
			}],
			
		},function(err,results){
			locals.snapshots=results.getSnapshots;
			var accounts=results.getAccounts;
			locals.snapshots.forEach(function(s){
				accounts.forEach(function(account){ // expanding account in the transaction object
					if(s.account==account.id)
						s.account=account;
				});
				var moment = require('moment-timezone');
				s.takenAt=moment(s.takenAt).tz('Asia/Kolkata').format();
			})
			locals.moment=require('moment-timezone');
			res.view('list_snapshots',locals);
			
		});
	},
	createSnapshot:function(req,res){
		Account.find({user:req.user.id}).exec(function(err,accounts){
			if(req.body){ // post request
				console.log(req.body);
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
				var findFilter={
					createdBy:'user',
					original_currency:req.body.original_currency,
					original_amount:-(req.body.original_amount),
					// needs a bit more filtering
				};
				var s={
					balance:req.body.balance,
					takenAt: new Date(req.body.date+' '+req.body.time+req.body.tz),
					createdBy:'user',
					account:req.body.account_id,
				}
				// console.log('before transaction find or create');
				console.log(s);
				Snapshot.create(s).exec(function(err,transaction){
					if(err)
						throw err;
					else
						res.redirect('/snapshots');
				});
			}else{ // view the form
				var locals={
					status:'',
					balance:'',
					account_id:'',
					message:'',
					accounts:accounts
				}
				console.log(locals);
				res.view('create_snapshot',locals);
			}
		})
	},

};


//

