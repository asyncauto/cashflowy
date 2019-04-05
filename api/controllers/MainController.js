/**
 * MainController
 *
 * @description :: Server-side logic for managing mains
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const fs = require('fs');
const async = require('async');
const fx = require('money');
const AWS = require('aws-sdk');

fx.base='INR';
fx.rates=sails.config.fx_rates;

var temp_count = 10;

var request = require("request");
var jwt = require("jsonwebtoken");
module.exports = {
	landingPage:function(req,res){
		if(req.user){
			Member.find({ user:req.user.id }).populate('org').sort('id ASC').exec(function(err,memberships){
				if (req.user.details && req.user.details.settings && req.user.details.settings.default_org){
					res.redirect('/org/' + req.user.details.settings.default_org + '/dashboard');
				} else{
					res.redirect('/org/'+memberships[0].org.id+'/dashboard');
				}
			});
			// res.view('landing_page');
		} else 
			res.redirect('/login')
	},
	listCategories:function(req,res){
		Category.find({org:req.org.id}).sort('name ASC').exec(function(err,categories){
			var locals={
				categories:categories
			}
			locals.parents=GeneralService.orderCategories(categories);
			res.view('list_categories',locals);
		});
	},
	createCategory:function(req,res){
		if(_.isArray(req.body)){
			_.forEach(req.body, function(c){
				c.org = req.org.id
			});

			Category.create(req.body).exec(function(err, cats){
				if(err)
					return res.status(500).json({error: err.message})
				return res.json(cats);
			});
		}
		else{

			Category.find({org:req.org.id}).exec(function(err,categories){
			if(req.body){ // post request
				if(!req.body.budget)
					req.body.budget='10000';
				var c={
					name:req.body.name,
					description:req.body.description,
					budget:parseInt(req.body.budget),
					org:req.org.id,
					type:req.body.type,
				}
				if(req.body.parent_id)
					c.parent=req.body.parent_id;
				// console.log('before transaction find or create');
				console.log(c);
				Category.create(c).exec(function(err,transaction){
					if(err){
						console.log(err);
						throw err;
					}
					else
						res.redirect('/org/' + req.org.id +'/categories');
				});
			}else{ // view the form
				var locals={
					status:'',
					message:'',
					name:'',
					description:'',
					budget:'10000',
					parent_id:'',
					type:'expense',
					categories:categories
				}
				console.log(locals);
				res.view('create_category',locals);
			}
		})
		}
	},
	viewCategory:function(req,res){
		// get account of the user
		// find sub categories
		var locals = {};
		async.auto({
			getCategory:function(callback){
				Category.findOne({id:req.params.id}).populate('parent').exec(callback)
			},
			getChildrenCategories:function(callback){
				Category.find({parent:req.params.id}).exec(callback)
			},
			getAccounts:function(callback){
				Account.find({org:req.org.id}).exec(callback)
			}
		},function(err,results){

			var locals = {
				category:results.getCategory,
				children_categories:results.getChildrenCategories,
				// user_accounts:results.getAccounts,
				metabase:{}
			}
			var questions=[
				{
					url_name:'sub_categories_expense',
					question_id:26,
					params:{
						account_ids:_.map(results.getAccounts,'id').join(','),
						category_ids:_.map(results.getChildrenCategories,'id').join(','),
					}
				},
				{
					url_name:'sub_categories_income',
					question_id:27,
					params:{
						account_ids:_.map(results.getAccounts,'id').join(','),
						category_ids:_.map(results.getChildrenCategories,'id').join(','),
					}
				},
				{
					url_name:'income_expense',
					question_id:28,
					params:{
						category_ids:""+results.getCategory.id,
					}
				},
			]
			questions.forEach(function(q){
				var payload = {
					resource: { question: q.question_id },
					params:q.params,
				};
				var token = jwt.sign(payload, sails.config.metabase.secret_key);
				locals.metabase[q.url_name]=sails.config.metabase.site_url + "/embed/question/" + token + "#bordered=true&titled=false";
				console.log('\n\n\n---------');
				console.log(payload);
			});
			console.log('\n\n\n---------');
			console.log(locals);
			res.view('view_category',locals);

		});
	},
	editCategory:function(req,res){
		Category.find({org:req.org.id}).exec(function(err,categories){
			if(!_.find(categories,{id:parseInt(req.params.id)}))
				return res.send('you dont have permission to modify this category');
			if(req.body){
				var c={
					name:req.body.name,
					description:req.body.description,
					budget:parseInt(req.body.budget),
					org:req.org.id,
					type:req.body.type,
					parent:0,
				}
				if(req.body.parent_id)
					c.parent=req.body.parent_id;
				// console.log('before transaction find or create');
				console.log(c);
				Category.update({id:req.params.id},c).exec(function(err,transaction){
					if(err){
						console.log(err);
						throw err;
					}
					else
						res.redirect('/org/' + req.org.id +'/categories');
				});

			}else{
				console.log(categories);
				console.log(req.params.id);
				var c = _.find(categories,{id:parseInt(req.params.id)});
				console.log(c);
				var locals={
					status:'',
					message:'',
					name:c.name,
					description:c.description,
					budget:c.budget,
					parent_id:c.parent,
					type:c.type,
					categories:categories
				}
				res.view('create_category',locals);
			}
		});
	},
	deleteCategory:function(req,res){
		async.auto({
			getCategory:function(callback){
				Category.findOne({id:req.params.id,org:req.org.id}).populate('parent').exec(callback);
			},
			getTransactionsCount:function(callback){
				Transaction.count({category:req.params.id}).exec(callback);
			},
			getChildrenCategories:function(callback){
				Category.find({parent:req.params.id,org:req.org.id}).exec(callback);
			}
		},function(err,results){
			if(err)
				throw err;
			if(req.body && req.body.confirm){ // confirming delete
				if(results.getChildrenCategories.length>0)
					res.send('this category has sub-categories. Delete all the sub-categories first');
				async.auto({
					getTransactions:function(callback){
						Transaction.find({category:req.params.id}).exec(callback);
					},
					updateTransactions:['getTransactions',function(results,callback){
						var t_ids=_.map(results.getTransactions,'id');
						Transaction.update({id:t_ids},{category:null}).exec(callback);
					}],
					deleteCategory:['updateTransactions',function(results,callback){
						Category.destroy({id:req.params.id}).exec(callback);
					}]
				},function(err,results){
					if(err)
						throw(err);
					res.redirect('/org/' + req.org.id +'/categories');
				})
				
			}else{ // showing the warning page
				
				var locals={
					category:results.getCategory,
					transactions_count:results.getTransactionsCount,
					children:results.getChildrenCategories,
				};
				console.log(locals);
				res.view('delete_category',locals);
			}
		})
		
	},
	listEmails:function(req,res){
		Email.find({org:req.org.id}).exec(function(err,emails){
			var locals={
				emails:emails
			}
			res.view('list_emails',locals);
		});
	},
	viewEmail: function(req, res){
		async.auto({
			getEmail: function(cb){
				Email.findOne({id: req.params.id, org:req.org.id})
					.exec(function(err, e){
						if(err) return cb(err);
						if(!e) return cb(new Error('Invalid Email'));
						return cb(null, e);
					});
			},
			findParsedEmails: ['getEmail', function(results, cb){
				Parsed_email.find({email: results.getEmail.email, org:req.org.id}).sort('createdAt DESC').limit(100).exec(cb);
			}],
			findParseFailures:['getEmail', function(results, cb){
				Parse_failure.find({email: results.getEmail.email, org:req.org.id}).sort('createdAt DESC').limit(100).exec(cb);
			}] 
		}, function(err, results){
			var locals={
				error: err? err.message:'',
				email:results.getEmail,
				parsed_emails: results.findParsedEmails,
				parse_failures: results.findParseFailures,
				moment: require('moment-timezone')
			}
			res.view('view_email',locals);
		})
	},
	retryParseFailure: function(req, res){
		async.auto({
			getParseFailure: function(cb){
				Parse_failure.findOne({id: req.params.id, org:req.org.id}).exec(function(err, pf){
					if(err) return cb(err);
					if(!pf || !_.get(pf, 'details.inbound')) return cb(new Error("NOT_FOUND"));
					return cb(null, pf);
				});
			},
			retryParsing: ['getParseFailure', function(results, cb){
				MailgunService.parseInboundEmail(_.get(results, 'getParseFailure.details.inbound'), cb);
			}]
		}, function(err, results){
			if(err){
				switch (err.message) {
					case 'NOT_FOUND':
						return res.status(404).json({error: 'NOT_FOUND'})
						break;
				
					default:
						return res.status(500).json({error: err.message});
						break;
				}
			}
			return res.json({status: 'success'})
		});
	},
	createEmail:function(req,res){
		if(req.body){ // post request
 			var e={
 				email:req.body.email,
 				org:req.org.id,
 			}
 			// console.log('before transaction find or create');
 			console.log(e);
 			Email.create(e).exec(function(err,transaction){
 				if(err){
 					console.log(err);
 					throw err;
 				}
 				else
					res.redirect('/org/' + req.org.id +'/emails');
 			});
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
	listAccounts:function(req,res){
		Account.find({org:req.org.id}).exec(function(err,accounts){
			var locals={
				accounts:accounts
			}
			res.view('list_accounts',locals);
		})
	},
	viewAccount:function(req,res){
		Account.findOne({id:req.params.id,org:req.org.id}).exec(function(err,account){
			if(!account)
				return res.send('you dont have the permission to view this account');
			var questions=[
				{
					url_name:'income_expense',
					question_id:21,
				},
				{
					url_name:'transfer_in_out',
					question_id:22,
				},
				{
					url_name:'balance',
					question_id:23,
				},
			]
			var locals={
				account:account,
				metabase:{}
			}
			questions.forEach(function(q){
				var payload = {
					resource: { question: q.question_id },
				};
				if(q.url_name=='balance')
					payload.params= {account_id:""+account.id};
				else
					payload.params= {account_ids:""+account.id};
				var token = jwt.sign(payload, sails.config.metabase.secret_key);
				locals.metabase[q.url_name]=sails.config.metabase.site_url + "/embed/question/" + token + "#bordered=true&titled=false";
			});
			res.view('view_account',locals);
		})
	},
	createAccount:function(req,res){
		if(req.body){ // post request
			var findFilter={
			};
			var a={
				name:req.body.name,
				acc_number:req.body.acc_number,
				type:req.body.type,
				org:req.org.id,
			}
			// console.log('before transaction find or create');
			console.log(a);
			Account.create(a).exec(function(err,transaction){
				if(err)
					throw err;
				else
					res.redirect('/org/' + req.org.id +'/accounts');
			});
		}else{ // view the form
			var locals={
				status:'',
				message:'',
				name:'',
				acc_number:'',
				type:'',
			}
			console.log(locals);
			res.view('create_account',locals);
		}
	},
	editAccount:function(req,res){
		if(req.body){ // post request
			var findFilter={
			};
			var a={
				name:req.body.name,
				acc_number:req.body.acc_number,
				type:req.body.type,
				org:req.org.id,
			}
			// console.log('before transaction find or create');
			// console.log(a);
			Account.update({id:req.params.id},a).exec(function(err,account){
				if(err)
					throw err;
				else
					res.redirect('/org/' + req.org.id +'/accounts');
			});
		}else{ // view the form
			Account.findOne({id:req.params.id}).exec(function(err,a){
				var locals={
					status:'',
					message:'',
					name:a.name,
					acc_number:a.acc_number,
					type:a.type,
				}
				// console.log(locals);
				res.view('create_account',locals);
			});
		}
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
				Account.find({org:req.org.id}).sort('name ASC').exec(callback);
			},
			getCategories:function(callback){
				Category.find({org:req.org.id}).exec(callback);
			},
			getTlisWithOutDescription: ['getAccounts', function(results, callback){
				var  accounts =  _.map(results.getAccounts,'id')
				Transaction_line_item.find({description: {'!=': null }, account:accounts}).exec(callback);
			}],
			getDocumentsCount: function(callback){
				Document.count({org:req.org.id}).exec(callback);
			},
			getEmailCount: function(callback){
				Email.count({org:req.org.id}).exec(callback);
			},
			getCategorySpending:['getAccounts',function(results,callback){

				var escape=[year];
				var query = 'select count(*),sum(amount_inr),category from transaction_line_item';
				query+=' where';
				query+=" type='income_expense'";
				query+=' AND EXTRACT(YEAR FROM "occuredAt") = $1';
				if(month){
					escape.push(month);
					query+=' AND EXTRACT(MONTH FROM "occuredAt") = $2';
				}
				if(_.map(results.getAccounts,'id').length)
					query+=' AND account in '+GeneralService.whereIn(_.map(results.getAccounts,'id'));
				// in the accounts that belong to you
				query+=' group by category';
				sails.sendNativeQuery(query,escape,function(err, rawResult) {
					if(err)
						callback(err);
					else
						callback(err,rawResult.rows);
				});
			}],
			getSnapshots:['getAccounts',function(results,callback){
				var escape=[year];
				var query = 'select *,EXTRACT(Day from "takenAt") as day from snapshot';
				query+=' where';
				query+=' EXTRACT(YEAR FROM "takenAt") = $1';
				if(month){
					escape.push(month);
					query+=' AND EXTRACT(MONTH FROM "takenAt") = $2';
				}
				if(_.map(results.getAccounts,'id').length)
					query+=' AND account in '+GeneralService.whereIn(_.map(results.getAccounts,'id'));
				query+=' ORDER BY "takenAt" ASC';
				// where accounts in the accounts that belong to you
				sails.sendNativeQuery(query,escape,function(err, rawResult) {
					if(err)
						callback(err);
					else
						callback(err,rawResult.rows);
				});
			}],
			getExpenseChartData:['getAccounts',function(results,callback){
				var escape=[year];
				var query = 'select count(*),sum(CASE WHEN amount_inr < 0 THEN amount_inr ELSE 0 END) expense_sum,sum(CASE WHEN amount_inr > 0 THEN amount_inr ELSE 0 END) income_sum,EXTRACT(Day from "occuredAt") as day from transaction';
				query+=' where';
				query+=" type='income_expense'";
				query+=' AND EXTRACT(YEAR FROM "occuredAt") = $1';
				if(month){
					escape.push(month);
					query+=' AND EXTRACT(MONTH FROM "occuredAt") = $2';
				}
				if(_.map(results.getAccounts,'id').length)
					query+=' AND account in '+GeneralService.whereIn(_.map(results.getAccounts,'id'));
				query+=' group by day';
				query+=' order by day';
				sails.sendNativeQuery(query,escape,function(err, rawResult) {
					console.log('\n\n\n\n');
					if(err)
						callback(err,[]);
					else
						callback(err,rawResult.rows);
				});
			}]
		},function(err,results){
			if(err){
				console.log('\n\n\n====err');
				console.log(err);
				throw err;
			}
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

			//setup checklist
			var setup_checklist = {
				verify_email: 'completed',
				email: results.getEmailCount? 'completed':'disabled',
				categories: results.getCategories.length? 'completed':'disabled',
				description: results.getTlisWithOutDescription && results.getTlisWithOutDescription.length ? 'completed':'disabled',
				document: results.getDocumentsCount? 'completed':'disabled'
			}
			
			_.forEach(setup_checklist, function(value, key){
				if(value == 'disabled'){
					setup_checklist[key] = 'active';
					return false;
				}
			});

			var percentage_completed = 0;
			_.forEach(setup_checklist, function(value, key){
				if(value =='completed')
					percentage_completed += 20;
			});

			setup_checklist.percentage_completed = percentage_completed;

			var locals={
				current:year+'-'+month,
				accounts:results.getAccounts,
				categories:GeneralService.orderCategories(results.getCategories),
				setup_checklist: setup_checklist
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
				y_income:[],
				y_expense:[]
			}
			var i=1;
			results.getExpenseChartData.forEach(function(row){
				for(;i<row.day;i++){
					locals.chart.x.push(i);
					locals.chart.y_income.push(0);
					locals.chart.y_expense.push(0);
				}
				locals.chart.x.push(row.day);

				locals.chart.y_income.push(row.income_sum);
				locals.chart.y_expense.push(-row.expense_sum);
				i++;
			});
			// locals.chart.x.forEach()
			console.log(locals.chart);
			locals.snapshots=results.getSnapshots;
			locals.chart2={
				datasets:[],
			};
			locals.chart3={
				datasets:[],
			};
			results.getAccounts.forEach(function(account,i){
				var colors = ['rgb(255, 205, 86)','rgb(75, 192, 192)','rgb(54, 162, 235)', 'rgb(153, 102, 255)', 'rgb(201, 203, 207)','rgb(255, 99, 132)', 'rgb(255, 159, 64)'];
				var dataset2 ={
					label: account.name,
					backgroundColor: colors[i],
					borderColor: colors[i],
					data: [],
					fill: false,
					// steppedLine: 'before'
				}
				var dataset3 ={
					label: account.name,
					backgroundColor: colors[i],
					borderColor: colors[i],
					data: [],
					fill: false,
					// steppedLine: 'before'
				}
				// ########## logic for one snapshot per day
				var temp=null;
				var snapshots=[];
				results.getSnapshots.forEach(function(s){
					if(s.account==account.id){
						if(temp && temp.day!=s.day)
							snapshots.push(temp);
						temp=s;
					}
				})
				if(temp)
					snapshots.push(temp); // adding the last snapshot
				// ########## logic for one snapshot per day
				console.log('\n\n\n **********');
				console.log(snapshots);
				
				snapshots.forEach(function(snapshot){
					if(snapshot.account==account.id){
						dataset2.data.push({
							x:snapshot.day,
							y:snapshot.balance,
						});
						if(snapshot.details && snapshot.details.uam){
							dataset3.data.push({
								x:snapshot.day,
								y:snapshot.details.uam.value,
							});
						}
					}
				});
				
				locals.chart2.datasets.push(dataset2);
				locals.chart3.datasets.push(dataset3);
			})
			// res.send(locals);
			res.view('dashboard',locals);
		})

	},
	listTransactions:function(req,res){
		var locals={};
		// getUserEmailIds:function
		var limit = req.query.limit?req.query.limit:100;
		async.auto({
			getAccounts:function(callback){
				Account.find({org:req.org.id}).exec(callback);
			},
			getDocuments:function(callback){ // only for filter
				Document.find({org:req.org.id}).sort('createdAt DESC').exec(callback);
			},
			getTransactionsInDocument:function(callback){
				if(req.query.document){
					Statement_line_item.find({document:req.query.document}).exec(callback);
				}else
					callback(null);
			},
			getTlis:['getAccounts','getTransactionsInDocument',function(results,callback){
				//account filter
				var accounts=[];
				if(!_.isNaN(parseInt(req.query.account))){
					accounts.push(req.query.account);
				}else{
					results.getAccounts.forEach(function(account){
						accounts.push(account.id);
					});
				}
				var filter={
					account:accounts,
				}
				if(req.query.document){
					filter.id=_.map(results.getTransactionsInDocument,'transaction');
					console.log(filter.id);
				}
				// category filter
				if(!_.isNaN(parseInt(req.query.category)))
					filter.category=req.query.category;
				else if(req.query.category == 'empty')
					filter.category = null;
				
				// third party filter
				if(req.query.third_party)
					filter.third_party = {contains: req.query.third_party }

				// description filter
				if(req.query.description)
					filter.description = {contains: req.query.description }

				if(req.query.description == 'empty')
					filter.description = null;


				// txn type filter
				if(req.query.txn_type){
					switch (req.query.txn_type) {
						case 'transfer':
							filter.type = 'transfer'
							break;
						case 'income':
							filter.type = 'income_expense'
							filter.amount_inr = {'>':0};
							break;
						case 'expense':
							filter.type = 'income_expense'
							filter.amount_inr = {'<':0};
							break;
						default:
							break;
					}
				}

				//amount range filter
				var amount_less_than  = !_.isNaN(parseInt(req.query.amount_less_than))?parseInt(req.query.amount_less_than) : null;
				var amount_greater_than  = !_.isNaN(parseInt(req.query.amount_greater_than)) ? parseInt(req.query.amount_greater_than) : 0;
				// default case
				filter.or = 
					[
						{amount_inr :{'>': amount_greater_than > 0 ? amount_greater_than: (-1) * amount_greater_than }},
						{amount_inr :{'<': amount_greater_than < 0 ?  amount_greater_than: (-1) * amount_greater_than}}
					]
				if(amount_less_than)
					filter.or = 
						[
							{amount_inr :{'<': amount_less_than > 0 ? amount_less_than: (-1) * amount_less_than , '>': amount_greater_than > 0 ? amount_greater_than: (-1) * amount_greater_than }},
							{amount_inr :{'>': amount_less_than < 0 ?  amount_less_than: (-1) * amount_less_than, '<': amount_greater_than < 0 ?  amount_greater_than: (-1) * amount_greater_than}}
						]
					
				// occured_at filter
				var moment = require('moment-timezone');
				try{
					var date_to  = req.query.date_to ? moment(req.query.date_to, 'YYYY-MM-DD').endOf('day').tz('Asia/Kolkata').toDate() : new Date();
					var date_from = req.query.date_from ? moment(req.query.date_from, 'YYYY-MM-DD').tz('Asia/Kolkata').toDate() : null;
					//default case
					filter.occuredAt = {'<': date_to };
					if(date_from)
						filter.occuredAt = {'>':date_from, '<': date_to };			
				} catch(err){
					sails.log.error('error while parsing the dates', err);
				}
				//sort filter
				var sort = 'occuredAt DESC';
				if(req.query.sort)
					sort = req.query.sort

				Transaction_line_item.find(filter).sort(sort).limit(limit).populate('tags').populate('transaction').exec(callback);
			}],
			getCategories:function(callback){
				Category.find({org:req.org.id}).sort('name ASC').exec(callback);
			},
			getTags:function(callback){
				Tag.find({org:req.org.id}).exec(callback);
			},
			getParsedEmails:['getTlis',function(results,callback){
				var t_ids=_.map(results.getTlis,function(tli){return tli.transaction.id});
				Parsed_email.find({transaction:t_ids}).exec(callback);
			}],
			getSLIs:['getTlis',function(results,callback){
				var t_ids=_.map(results.getTlis,function(tli){return tli.transaction.id});
				Statement_line_item.find({transaction:t_ids}).populate('document').exec(callback);
			}]
		},function(err,results){
			if (err)
				throw err;
			locals.tlis = results.getTlis
			var accounts=results.getAccounts;
			locals.tlis.forEach(function(t){
				// set to two decimal number
				_.set(t, 'original_amount', _.get(t, 'original_amount', 0).toFixed(2))
				_.set(t, 'amount_inr', _.get(t, 'amount_inr', 0).toFixed(2))
				_.set(t, 'transaction.original_amount', _.get(t, 'transaction.original_amount', 0).toFixed(2))
				_.set(t, 'transaction.amount_inr', _.get(t, 'transaction.amount_inr', 0).toFixed(2))
				accounts.forEach(function(account){ // expanding account in the transaction object
					if(t.account==account.id)
						t.account=account;
					if(t.to_account==account.id)
						t.to_account=account;
					
					if(t.transaction.account==account.id)
						t.transaction.account=account;
					if(t.transaction.to_account==account.id)
						t.transaction.to_account=account;
				});
				t.transaction.parsed_emails=[];
				// console.log(results.getParsedEmails);
				results.getParsedEmails.forEach(function(pe){
					if(t.transaction.id == pe.transaction)
						t.transaction.parsed_emails.push(pe);
				})
				t.transaction.slis=[];
				results.getSLIs.forEach(function(sli){
					if(t.transaction.id==sli.transaction)
						t.transaction.slis.push(sli);
				})
				var moment = require('moment-timezone');
				t.occuredAt=moment(t.occuredAt).tz('Asia/Kolkata').format();
			})
			locals.transactions = _(results.getTlis)
				.groupBy(item => item.transaction.id)
				.sortBy(group => results.getTlis.indexOf(group[0]))
				.value()
			
			locals.accounts=results.getAccounts;
			locals.tags=results.getTags;
			locals.documents=results.getDocuments;
			locals.categories=GeneralService.orderCategories(results.getCategories);
			locals.moment=require('moment-timezone');
			locals.query_string=require('query-string');
			if(req.query.download_csv=='true'){
				const json2csv = require('json2csv').parse;
				const csvString = json2csv(locals.tlis);
				res.setHeader('Content-disposition', 'attachment; filename=transactions-filtered.csv');
				res.set('Content-Type', 'text/csv');
				res.status(200).send(csvString);
			}
			else
				res.view('list_transactions',locals);
			
		});
	},
	createTransaction:function(req,res){
		Account.find({org:req.org.id}).exec(function(err,accounts){
			if(req.body){ // post request
				console.log(req.body);
				const fx = require('money');
				fx.base='INR';
				fx.rates=sails.config.fx_rates;
				var findFilter={
					createdBy:'user',
					original_currency:req.body.original_currency,
					original_amount:-(req.body.original_amount),
					// needs a bit more filtering
				};
				var t={
					original_currency:req.body.original_currency,
					// original_amount:-(req.body.original_amount),
					// amount_inr:-(fx.convert(req.body.original_amount, {from: req.body.original_currency, to: "INR"})),
					occuredAt: new Date(req.body.date+' '+req.body.time+req.body.tz),
					createdBy:'user',
					// type:'income_expense',
					description:req.body.description,
					account:req.body.account_id,
					third_party:req.body.third_party
				}
				if(req.body.type=='expense'){
					t.type='income_expense';
					t.original_amount=-(req.body.original_amount);
					t.amount_inr=-(fx.convert(req.body.original_amount, {from: req.body.original_currency, to: "INR"}));
				}else if(req.body.type=='income'){
					t.type='income_expense';
					t.original_amount=(req.body.original_amount);
					t.amount_inr=(fx.convert(req.body.original_amount, {from: req.body.original_currency, to: "INR"}));
				}else if(req.body.type=='transfer'){
					t.type='transfer';
					t.original_amount=-(req.body.original_amount);
					t.amount_inr=-(fx.convert(req.body.original_amount, {from: req.body.original_currency, to: "INR"}));
					t.to_account=req.body.to_account;
				}
				// console.log('before transaction find or create');
				console.log(t);
				Transaction.create(t).exec(function(err,transaction){
					if(err)
						throw err;
					else{
						if(req.body.referer && req.body.referer.includes('/transactions'))
							res.redirect(req.body.referer);
						else 
							res.redirect('/org/' + req.org.id +'/transactions');
					}
				});
			}else{ // view the form
				var locals={
					occuredAt:'',
					status:'',
					message:'',
					description:'',
					original_amount:'',
					original_currency:'',
					third_party:'',
					account_id:'',
					to_account:'',
					accounts:accounts,
					type:'expense',
				}
				console.log(locals);
				res.view('create_transaction',locals);
			}
		})
	},
	updateTli: function(req,res){
		async.auto({
			getTli: function(cb){
				Transaction_line_item.findOne(req.params.id).populate('account').exec(cb)
			},
			updateTli: ['getTli', function(results, cb){
				if(_.get(results, 'getTli.account.org') != req.org.id)
					return cb(new Error('INVALID_ACCESS'));
				Transaction_line_item.update({id: req.params.id}, req.body).exec(cb);
			}]
		}, function(err, results){
			if(err){
				switch (err.message) {
					case 'INVALID_ACCESS':
						return res.status(401).json({error: 'INVALID_ACCESS'});
						break;
					default:
						return res.status(500).json({error: err.message});
						break;
				}
			}
			var updated = _.get(results, 'updateTli[0]', {})
			return res.status(200).json(updated)
		})
	},
	editTransaction:function(req,res){
		Account.find({org:req.org.id}).exec(function(err,accounts){
			if(req.body){ // post request
				console.log(req.body);
				const fx = require('money');
				fx.base='INR';
				fx.rates=sails.config.fx_rates;
				var t={
					original_currency:req.body.original_currency,
					// original_amount:-(req.body.original_amount),
					// amount_inr:-(fx.convert(req.body.original_amount, {from: req.body.original_currency, to: "INR"})),
					occuredAt: new Date(req.body.date+' '+req.body.time+req.body.tz),
					createdBy:'user',
					// type:'income_expense',
					description:req.body.description,
					account:req.body.account_id,
					third_party:req.body.third_party
				}
				if(req.body.type=='expense'){
					t.type='income_expense';
					t.original_amount=-(req.body.original_amount);
					t.amount_inr=-(fx.convert(req.body.original_amount, {from: req.body.original_currency, to: "INR"}));
				}else if(req.body.type=='income'){
					t.type='income_expense';
					t.original_amount=(req.body.original_amount);
					t.amount_inr=(fx.convert(req.body.original_amount, {from: req.body.original_currency, to: "INR"}));
				}else if(req.body.type=='transfer'){
					t.type='transfer';
					t.original_amount=-(req.body.original_amount);
					t.amount_inr=-(fx.convert(req.body.original_amount, {from: req.body.original_currency, to: "INR"}));
					t.to_account=req.body.to_account;
				}
				// console.log('before transaction find or create');
				console.log(t);
				Transaction.update({id:req.params.id},t).exec(function(err,transaction){
					if(err)
						throw err;
					else
						res.redirect('/org/' + req.org.id +'/transactions');
				});
			}else{ // view the form
				Transaction.findOne({id:req.params.id}).exec(function(err,t){
					var locals={
						status:'',
						message:'',
						occuredAt:new Date(t.occuredAt).toISOString(),
						description:t.description,
						original_amount:-t.original_amount,
						original_currency:t.original_currency,
						third_party:t.third_party,
						account_id:t.account,
						to_account:t.to_account,
						accounts:accounts,
						// type:'expense',
						// color:'red',
					}
					if(t.type=='transfer')
						locals.type='transfer';
					else if(t.type=='income_expense'){
						if(t.original_amount<0)
							locals.type='expense';
						else
							locals.type='income';
					}
					console.log(locals);
					res.view('create_transaction',locals);
				});
			}
		})
	},
	deleteTransaction:function(req,res){
		if(req.body && req.body.confirm){ // confirming delete
			Transaction.destroy({id:req.params.id}).exec(function(err,t){
				if(err)
					throw(err);
				res.redirect('/org/' + req.org.id +'/transactions');
			});
		}else{ // showing the warning page
			Transaction.findOne({id:req.params.id}).populate('account').exec(function(err,t){
				t.occuredAt=new Date(t.occuredAt).toISOString();
				var locals={t:t};
				res.view('delete_transaction',locals);
			});
		}
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
		if(req.body.tli){
			// do you have permission to edit description of that transaction?
			async.auto({
				getAccounts:function(callback){
					Account.find({org:req.org.id}).exec(callback);
				},
				getTliDetails:function(callback){
					Transaction_line_item.findOne({id:req.body.tli}).exec(callback);
				},
			},function(err,results){
				if(err)
					throw err;
				var tli = results.getTliDetails;
				var flag=false;
				results.getAccounts.forEach(function(account){
					if(tli.account==account.id) // transaction in account of the user
						flag=true;
				});
				if(flag){
					Transaction_line_item.update({id:tli.id},{description:req.body.description}).exec(function(err,result){
						if(err)
							throw err;
						else
							res.send('ok');
					})
				}else{
					res.send(400,'you cant edit that transaction');
				}
			})
		}else if(req.body.doc){
			Document.findOne({id:req.body.doc}).exec(function(err,doc){
				if(doc.org==req.org.id){
					Document.update({id:doc.id},{description:req.body.description}).exec(function(err,result){
						if(err)
							throw err;
						else
							res.send('ok');
					});
				}else{
					res.send(400,'you cant edit that document');
				}
			})
		}
	},
	listSnapshots:function(req,res){
		
		var locals={};
		// getUserEmailIds:function
		var limit = req.query.limit?req.query.limit:100;
		async.auto({
			getAccounts:function(callback){
				Account.find({org:req.org.id}).exec(callback);
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
		Account.find({org:req.org.id}).exec(function(err,accounts){
			if(req.body){ // post request
				console.log(req.body);
				const fx = require('money');
				fx.base='INR';
				fx.rates=sails.config.fx_rates;
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
						res.redirect('/org/' + req.org.id +'/snapshots');
				});
			}else{ // view the form
				var locals={
					status:'',
					balance:'',
					takenAt:'',
					account_id:'',
					message:'',
					accounts:accounts
				}
				console.log(locals);
				res.view('create_snapshot',locals);
			}
		})
	},
	editSnapshot:function(req,res){
		Account.find({org:req.org.id}).exec(function(err,accounts){
			if(req.body){ // post request
				console.log(req.body);
				const fx = require('money');
				fx.base='INR';
				fx.rates=sails.config.fx_rates;
				var s={
					balance:req.body.balance,
					takenAt: new Date(req.body.date+' '+req.body.time+req.body.tz),
					createdBy:'user',
					account:req.body.account_id,
				}
				// console.log('before transaction find or create');
				console.log(s);
				Snapshot.update({id:req.params.id},s).exec(function(err,transaction){
					if(err)
						throw err;
					else
						res.redirect('/org/' + req.org.id +'/snapshots');
				});
			}else{ // view the form
				Snapshot.findOne({id:req.params.id}).exec(function(err,s){
					var locals={
						status:'',
						balance:s.balance,
						account_id:s.account,
						takenAt:new Date(s.takenAt).toISOString(),
						message:'',
						accounts:accounts
					}
					console.log(locals);
					res.view('create_snapshot',locals);
				});
			}
		});
	},
	deleteSnapshot:function(req,res){
		if(req.body && req.body.confirm){ // confirming delete
			Snapshot.destroy({id:req.params.id}).exec(function(err,s){
				if(err)
					throw(err);
				res.redirect('/org/' + req.org.id +'/snapshots');
			});
		}else{ // showing the warning page
			Snapshot.findOne({id:req.params.id}).populate('account').exec(function(err,s){
				s.takenAt=new Date(s.takenAt).toISOString();
				var locals={s:s};
				res.view('delete_snapshot',locals);
			});
		}
	},
	emailTest:function(req,res){
		// MailgunService.sendEmail({},function(err){
		// 	res.send('email sent');
		// })
		var options={
			start_date:new Date('2018-09-24T00:00:00.000+0530'),
			end_date:new Date('2018-10-01T00:00:00.000+0530'),
			user:req.query.user,
		}
		NotificationService.sendWeeklyEmailReport(options,function(err,result){
			if(err)
				throw err;
			res.send(result);
		})
	},
	listDocuments: function(req, res){
		async.auto({
			getDocuments: function(cb){
				Document.find({org:req.org.id}).populate('accounts').populate('statement_line_items').sort('id DESC').exec(cb);
			},
			getUnresolvedDoubtfullTransaction: function(cb){
				var query = `SELECT count(*) AS unresolved_dts, sli.document FROM doubtful_transaction AS dt INNER JOIN statement_line_item AS sli ON dt.sli = sli.id 
				WHERE sli.org =${req.org.id} AND json_extract_path(dt.details::json, 'status') IS NULL GROUP BY sli.document`
				Doubtful_transaction.query(query,cb);
			}
		}, function(err, results){
			if(err) return res.view('500', err);
			
			var timeline = {
				groups:[],
				items:[]
			}

			_.forEach(results.getDocuments, function(d){
				var udt = _.find(results.getUnresolvedDoubtfullTransaction.rows, {document: d.id});
				if(udt)
					d.unresolved_dts = udt.unresolved_dts
			
				if(d.parsed_data && d.parsed_data.transactions_from_date && d.parsed_data.transactions_to_date){
					_.forEach(d.accounts, function(a){
						timeline.items.push({
							id: d.id,
							content: `${d.id}: ${d.details.original_filename}`,
							start: d.parsed_data.transactions_from_date,
							end: d.parsed_data.transactions_to_date,
							group: a.id
						})
						if(!_.find(timeline.groups, {id:a.id}))
							timeline.groups.push({
								id: a.id,
								content: `<a href=/account/${a.id}>${a.name}<a>`
							})
					})
				}
			});
			
			var locals={
				documents:results.getDocuments,
				moment: require('moment-timezone'),
				timeline: timeline
			}
			res.view('list_documents',locals);
		})
	},
	viewDocument:function(req,res){
		async.auto({
			getDoc:function(callback){
				Document.findOne({id:req.params.id, org:req.org.id}).exec(callback);
			},
			getSLIs:function(callback){
				Statement_line_item.find({document:req.params.id}).populate('transaction').sort('pos ASC').exec(callback);
			},
			getDoubtfulTransactions:['getSLIs',function(results,callback){
				Doubtful_transaction.find({sli:_.map(results.getSLIs,'id')}).exec(callback);
			}],
			getAccounts:function(callback){
				Account.find({org:req.org.id}).exec(callback);
			}
		},function(err,results){
			var unresolved_dts=[]
			results.getDoubtfulTransactions.forEach(function(dt){
				if(!dt.details.status)
					unresolved_dts.push(_.cloneDeep(dt));
			});
			results.getDoubtfulTransactions.forEach(function(dt){
				results.getSLIs.forEach(function(sli){
					if(dt.sli==sli.id){
						sli.dt=dt;
						// dt.sli=sli;
					}
				})
			});
			results.getSLIs.forEach(function(sli){
				results.getAccounts.forEach(function(account){
					if(sli.transaction){
						if(sli.transaction.account==account.id)
							sli.transaction.account=account;
						if(sli.transaction.to_account==account.id)
							sli.transaction.to_account=account;
					}
				})
			})
			var locals={
				doc:results.getDoc,
				slis:results.getSLIs,
				doubtful_transactions:results.getDoubtfulTransactions,
				unresolved_dts:unresolved_dts,
				moment:require('moment-timezone'),
			};
			// res.send(locals);
			res.view('view_document',locals);
		})
		// get
			// show extracted data 
			// statement line items 
			// transactions created from each of the statement line item
			// ones that has been marked as 
	},
	
	createDocument: function(req, res) {
		if (req.method == 'GET') {
			var locals = {
				type: '',
				message: ''
			}
			res.view('create_document', locals)
		} else {
			var locals = {
				type: '',
				message: ''
			}
			async.auto({
				uploadFile: function (cb) {
					req.file('file').upload(function (err, uploadedFiles) {
						if (err) return cb(err);
						cb(null, uploadedFiles)
					});
				},
				uploadFileToS3: ['uploadFile', function(results, cb){
					var s3 = new AWS.S3({
						accessKeyId: sails.config.aws.key,
						secretAccessKey: sails.config.aws.secret,
						region: sails.config.aws.region
					});
					var params = {Bucket: sails.config.aws.bucket, 
						Key: results.uploadFile[0].fd, 
						Body: fs.createReadStream(`.tmp/uploads/${results.uploadFile[0].fd}`)
					};
					s3.upload(params, function(err, data) {
						cb(err, data);
					});
				}],
				createDocument: ['uploadFileToS3', function (results, cb) {
					Document.create({ org: req.org.id, parser_used: req.body.type, 
						details:{s3_key:results.uploadFileToS3.key, 
							original_filename:results.uploadFile[0].filename, 
							s3_location: results.uploadFileToS3.Location, 
							s3_bucket: results.uploadFileToS3.Bucket} }).exec(cb);
				}],
				sendToDocParser: ['createDocument', 'uploadFile', function (results, cb) {
	
					var options = {
						method: 'POST',
						url: `https://${sails.config.docparser.api_key}:@api.docparser.com/v1/document/upload/${req.body.type}`,
						json:true,
						formData:
							{
								remote_id: results.createDocument.id,
								file:
									{
										value: fs.createReadStream(`.tmp/uploads/${results.uploadFile[0].fd}`),
										options:
											{
												filename: results.uploadFile[0].filename,
												contentType: null
											}
									}
							}
					};
	
					request(options, function (error, response, body) {
						if (error) return cb(error);
						if(body && body.error)
							return cb(new Error(body.error));
						cb(null, body);
					});
	
				}]
			}, function(error, results){
				 var locals ={
					 type:'',
					 message:''
				 };

				if(error){
					 locals.message = error.message
					 return res.view('create_document', locals);
				}
				else	
					return res.redirect('/org/' + req.org.id +"/documents");
			})
			
		}
	},
	editDocument:function(req,res){
		res.send('edit a document here');
	},
	deleteDocument:function(req,res){
		res.send('delete a document using this');
	},
	listTags:function(req,res){
		Tag.find({org:req.org.id}).exec(function(err,tags){
			var locals={
				tags:tags
			}
			res.view('list_tags',locals);
		});
	},
	createTag:function(req,res){
		if(req.body){ // post request

			var t={
				name:req.body.name,
				description:req.body.description,
				org:req.org.id,
				type:'user',
			}
			console.log(t);
			Tag.create(t).exec(function(err,transaction){
				if(err){
					console.log(err);
					throw err;
				}
				else
					res.redirect('/org/' + req.org.id +'/tags');
			});
		}else{ // view the form
			var locals={
				status:'',
				message:'',
				name:'',
				description:'',
			}
			console.log(locals);
			res.view('create_tag',locals);
		}
	},
	viewTag:function(req,res){
		// get account of the user
		// find sub categories
		var locals = {};
		async.auto({
			getTag:function(callback){
				Tag.findOne({id:req.params.id}).exec(callback)
			},
		},function(err,results){

			var locals = {
				tag:results.getTag,
				// user_accounts:results.getAccounts,
				metabase:{}
			}
			var questions=[
				{
					url_name:'category_vice_expense',
					question_id:30,
					params:{
						tag_id:""+results.getTag.id,
					}
				},
				{
					url_name:'category_vice_income',
					question_id:31,
					params:{
						tag_id:""+results.getTag.id,
					}
				},
				{
					url_name:'income_expense',
					question_id:29,
					params:{
						tag_id:""+results.getTag.id,
					}
				},
			]
			questions.forEach(function(q){
				var payload = {
					resource: { question: q.question_id },
					params:q.params,
				};
				var token = jwt.sign(payload, sails.config.metabase.secret_key);
				locals.metabase[q.url_name]=sails.config.metabase.site_url + "/embed/question/" + token + "#bordered=true&titled=false";
				// console.log('\n\n\n---------');
				// console.log(payload);
			});
			// console.log('\n\n\n---------');
			// console.log(locals);
			res.view('view_tag',locals);

		});
	},
	editTag:function(req,res){
		Tag.findOne({org:req.org.id,id:req.params.id}).exec(function(err,tag){
			if(err)
				throw err;
			if(!tag)
				return res.send('No tag with this id or you dont have permission to edit this tag');
			console.log(tag);
			if(req.body){ // post request
				var t={
					name:req.body.name,
					description:req.body.description,
					org:req.org.id,
				}
				console.log(t);
				Tag.update({id:req.params.id},t).exec(function(err,transaction){
					if(err)
						throw err;
					else
						res.redirect('/org/' + req.org.id +'/tags');
				});
			}else{ // view the form
				var locals={
					status:'',
					message:'',
					name:tag.name,
					description:tag.description,
				}
				console.log(locals);
				res.view('create_tag',locals);
			}
		});
	},
	editTags:function(req,res){
		async.auto({
			getAllTags:function(callback){
				Tag.find({org:req.org.id}).exec(callback);
			},
			getTli:function(callback){
				// console.log(req.body);
				Transaction_line_item.findOne({id:req.body.tli_id}).populate('tags').exec(callback);
			},
		},function(err,results){
			var all_tags=results.getAllTags;
			Transaction_line_item.replaceCollection(results.getTli.id, 'tags').members(req.body.new_tags).exec(function(err, txn){
				Transaction_line_item.findOne({id:req.body.tli_id}).populate('tags').exec(function(err,new_t){
					res.view('partials/display_tags', {tags: new_t.tags,layout:false});
					
				});
			});
		});
	},
	viewDoubtfulTransaction:function(req,res){
		async.auto({
			getDT:function(callback){
				Doubtful_transaction.findOne({id:req.params.id}).exec(callback);
			},
			getAccounts:['getDT',function(results,callback){
				var dt = results.getDT;
				var account_ids = _.map(dt.similar_transactions,'account');
				var to_account_ids = _.map(dt.similar_transactions,'to_account');
				account_ids.push(dt.transaction.account);
				to_account_ids.forEach(function(acc){
					if(acc)
						account_ids.push(acc);
				});

				console.log(account_ids);
				Account.find({id:account_ids}).exec(callback);
			}]
		},function(err,results){
			
			results.getAccounts.forEach(function(account){
				if(account.id==results.getDT.transaction.account)
					results.getDT.transaction.account=account;
			});
			results.getDT.similar_transactions.forEach(function(st){
				results.getAccounts.forEach(function(account){
					if(account.id==st.account)
						st.account=account;
					if(account.id==st.to_account)
						st.to_account=account;
				});
			})

			var locals={
				dt:results.getDT,
				moment:require('moment-timezone'),
			};
			res.view('view_doubtful_transaction',locals);
		})
	},
	markDTAsUnique:function(req,res){
		async.auto({
			getDT:function(callback){
				Doubtful_transaction.findOne({id:req.params.id}).exec(callback);
			},
			createTransaction:['getDT',function(results,callback){
				var t = results.getDT.transaction;
				Transaction.create(t).exec(callback);
			}],
			updateDoubtfulTransaction:['getDT','createTransaction',function(results,callback){
				var dt = results.getDT;
				if(!dt.details)
					dt.details={};
				dt.details.status='unique';
				dt.details.related_txn_id=results.createTransaction.id;
				Doubtful_transaction.update({id:dt.id},{details:dt.details}).exec(callback);
			}],
			updateSLI:['getDT','createTransaction',function(results,callback){
				var sli_id = results.getDT.sli;
				Statement_line_item.update({id:sli_id},{transaction:results.createTransaction.id}).exec(callback);
			}]
		},function(err,results){
			if(err)
				throw err;
			res.send('new transaction is created');
		})
		// create transaction
		// update doubtful transaction - mark as unique and add the transaction id
		// update sli or parsed email with the transaction id
	},
	markDTAsDuplicate:function(req,res){
		console.log('came here');
		console.log(req.params.id);
		console.log(req.params.orig_txn_id);
		async.auto({
			getDT:function(callback){
				Doubtful_transaction.findOne({id:req.params.id}).exec(callback);
			},
			updateDoubtfulTransaction:['getDT',function(results,callback){
				var dt = results.getDT;
				if(!dt.details)
					dt.details={};
				dt.details.status='duplicate';
				dt.details.related_txn_id=req.params.orig_txn_id;
				Doubtful_transaction.update({id:dt.id},{details:dt.details}).exec(callback);
			}],
			updateSLI:['getDT',function(results,callback){
				var sli_id = results.getDT.sli;
				Statement_line_item.update({id:sli_id},{transaction:req.params.orig_txn_id}).exec(callback);
			}]
		},function(err,results){
			if(err)
				throw err;
			res.send('marked as duplicate');
		})
		// res.send('all done');
		// update doubtful transaction - mark as duplicate, and mention the transction id
		// update sli or parsed email with the transaction id
	},
	listRules:function(req,res){
		Rule.find({org:req.org.id}).exec(function(err, rules){
			var locals={
				rules:rules
			}
			res.view('list_rules',locals);
		})
	},
	createRule:function(req,res){
		Rule.create({org:req.org.id, status: 'draft', type:'user', description:'rule #drafted'}).exec(
			function(err, r){
				if(err) return res.view('500', err);
				res.redirect('/org/' + req.org.id +`/rule/${r.id}/edit`);
			})
	},
	editRule:function(req,res){
		async.auto({
			findRule: function(cb){
				Rule.findOne({org:req.org.id, id: req.params.id}).exec(cb)
			},
			getAccounts: function(cb){
				Account.find({org:req.org.id}).exec(cb);
			}
		},function(err, results){
			if(err) return res.serverError(err);
			if(!results.findRule) return res.view('404');
			if(req.body){
				var update = _.pick(req.body, ['trigger' , 'action', 'description', 'status', 'type']);
				var details = _.omit(req.body, ['trigger' , 'action', 'description', 'status', 'type']);
				_.forEach(details, function(v, k){
					if(v)
						_.set(update, k, v);
				});
				Rule.update({id: results.findRule.id, org:req.org.id}, update).exec(function(err, u_r){
					if(err) return res.serverError(err);
					if(!u_r.length) return res.view('404');
					var locals = {
						rule: u_r[0],
						accounts: results.getAccounts
					}
					res.view('create_rule', locals);
				})
			}else{
				var locals = {
					rule: results.findRule,
					accounts: results.getAccounts
				}
				res.view('create_rule', locals);
			}
		});
	},
	listPnLs:function(req,res){
		async.auto({
			getPnls:function(callback){
				Pnl.find({org:req.org.id}).exec(callback);
			}
		},function(err,results){
			var locals={
				pnls:results.getPnls
			}
			res.view('list_pnls',locals);
		})
	},
	createPnL:function(req,res){
		var locals={
			sub:{},
			pnl:{},
			status:'',
			message:'',
		}
		if(req.body){
			var pnl={
				org:req.org.id,
				name:req.body.name,
				type:'single_pnl_head',
				details:{
					pnl_head:1 // id of the category
				}

			}
			Pnl.create(pnl).exec(function(err,result){
				res.redirect('/org/' + req.org.id +'/pnls');
			})
		}else{
			async.auto({
				getCategories:function(callback){
					Category.find({org:req.org.id}).sort('name ASC').exec(callback);
				},
			},function(err,results){
				var categories = GeneralService.orderCategories(results.getCategories);
				var head = Math.floor(Math.random() * categories.length);
				locals.pnl.statement={
					head:[
						{
							cat_id_is:categories[head].id,
							name:categories[head].name
						}
					],
					income:[],
					expense:[],
				}
				categories[head].children.forEach(function(c_cat){
					if(c_cat.type=="income"){
						locals.pnl.statement.income.push({
							cat_id_id:c_cat.id,
							name:c_cat.name
						});
					}else if(c_cat.type=='expense'){
						locals.pnl.statement.expense.push({
							cat_id_id:c_cat.id,
							name:c_cat.name
						});
					}
				})
				res.view('create_pnl',locals);
			});
		}
	},
	editPnL:function(req,res){
		var locals={}
		res.view('create_pnl',locals);
	},
	indexPnL:function(req,res){
		locals={};
		Pnl.findOne({id:req.params.id}).exec(function(err,pnl){
			if(err)
				throw err;
			console.log(pnl);
			locals.pnl=pnl;
			res.view('index_pnl',locals);
		})
	},
	viewPnL:function(req,res){
		var locals={
			pnl:{}
		}
		// var month=null,year=null;
		// if(req.query.month){
		// 	year=req.query.month.substring(0,4);
		// 	month=req.query.month.substring(5,7);
		// }
		// else if(req.query.year)
		// 	year= req.query.year.substring(0,4);
		// else{
		// 	year=new Date().toISOString().substring(0,4);
		// 	month=new Date().toISOString().substring(5,7);
		// }
		if(!req.query.date_from)
			req.query.date_from='2018-04-01';
		if(!req.query.date_to)
			req.query.date_to='2019-04-01';
		
		
		async.auto({
			getAccounts:function(callback){
				Account.find({org:req.org.id}).sort('name ASC').exec(callback);
			},
			getAllCategories:function(callback){
				Category.find({org:req.org.id}).exec(callback);
			},
			getCategorySpendingPerMonth:['getAccounts',function(results,callback){

				var escape=[req.query.date_from,req.query.date_to];
				var query = 'select count(*),sum(amount_inr),EXTRACT(YEAR FROM "occuredAt") as "year",EXTRACT(MONTH FROM "occuredAt") as "month",category from transaction';
				query+=' where';
				query+=" type='income_expense'";
				// if(year){
				// 	query+=' AND EXTRACT(YEAR FROM "occuredAt") = $1';
				// }
				// if(month){
				// 	escape[1]=month;
				// 	query+=' AND EXTRACT(MONTH FROM "occuredAt") = $2';
				// }
				query+= ' AND CAST("occuredAt" AS date) BETWEEN CAST($1 AS date) AND CAST($2 AS date)';
   				
				if(_.map(results.getAccounts,'id').length)
					query+=' AND account in '+GeneralService.whereIn(_.map(results.getAccounts,'id'));
				// in the accounts that belong to you
				query+=' group by category, "year", "month"';
				query+=' order by "year" , "month" '
				console.log(query);
				Transaction.query(query,escape,function(err, rawResult) {
					if(err)
						callback(err);
					else
						callback(err,rawResult.rows);
				});
			}],
			getPnl:function(callback){
				Pnl.findOne({id:req.params.id}).exec(callback);
			},
		},function(err,results){
			if(err)
				throw err;
			var time_periods=[];
			// getting time periods
			results.getCategorySpendingPerMonth.forEach(function(row){
				var time_period_exists=false;
				time_periods.forEach(function(time_period){
					if(time_period.year==row.year && time_period.month==row.month)
						time_period_exists=true;
				})
				if(!time_period_exists)
					time_periods.push({year:row.year,month:row.month});
			})
			console.log(time_periods);
			locals.time_periods=time_periods;
			var temp = {};
			var temp2={};
			time_periods.forEach(function(tp){
				temp[tp.year+'-'+tp.month]=_.cloneDeep(results.getAllCategories);
				temp[tp.year+'-'+tp.month].forEach(function(cat){

					cat.t_count=0;
					cat.t_sum=0;
					// console.log(results.getCategorySpending);
					results.getCategorySpendingPerMonth.forEach(function(spend){
						if(cat.id==spend.category && tp.year==spend.year && tp.month==spend.month){
							cat.t_count=spend.count;
							cat.t_sum=spend.sum;
						}
					})
					// console.log(cat);
				});
				temp2[tp.year+'-'+tp.month]=_.cloneDeep(GeneralService.orderCategories(temp[tp.year+'-'+tp.month]));
				
			});
			var categories=[];
			if(results.getPnl.type=='single_pnl_head'){
				Object.keys(temp2).forEach(function(key,i){

					var head_cat=_.find(temp2[key],{id:results.getPnl.details.pnl_head_category});
					if(i==0){
						categories=head_cat.children;
						categories.forEach(function(c_cat){
							c_cat.columns={};	
						})
					}
					categories.forEach(function(c_cat){
						head_cat.children.forEach(function(cat2){
							if(cat2.id==c_cat.id)
								c_cat.columns[key]=cat2.super_sum;
						})
						
					})
				})
				
			}else if(results.getPnl.type=='no_pnl_head'){
				Object.keys(temp2).forEach(function(key,i){
					if(i==0){
						categories=temp2[key];
						categories.forEach(function(c_cat){
							c_cat.columns={};	
						})
					}
					categories.forEach(function(c_cat){
						temp2[key].forEach(function(cat2){
							if(cat2.id==c_cat.id)
								c_cat.columns[key]=cat2.super_sum;
						})
					})
				})
			}
			locals.pnl=results.getPnl;
			locals.pnl.header=time_periods;
			locals.pnl.rows=[];
			locals.pnl.rows.push({name:'Income',type:'header',columns:[]});
			var income_row = locals.pnl.rows.length-1;
			categories.forEach(function(cat){
				if(cat.type=="income"){
					locals.pnl.rows.push({
						name:cat.name,
						type:'income',
						columns:cat.columns,
					})
				}
			});
			locals.pnl.rows.push({name:'Expense',type:'header',columns:[]});
			var expense_row = locals.pnl.rows.length-1;
			categories.forEach(function(cat){
				if(cat.type=="expense"){
					locals.pnl.rows.push({
						name:cat.name,
						type:'expense',
						columns:cat.columns,
					})
				}
			});
			locals.pnl.rows.push({name:'Surplus',type:'header',columns:[]});
			var surplus_row = locals.pnl.rows.length-1;

			// Summing all incomes 
			var income_total=[];
			var expense_total=[];
			time_periods.forEach(function(tp){
				income_total[tp.year+'-'+tp.month]=0;
				expense_total[tp.year+'-'+tp.month]=0;
			});
			locals.pnl.rows.forEach(function(row){
				if(row.type=='income'){
					time_periods.forEach(function(tp){
						income_total[tp.year+'-'+tp.month]+=row.columns[tp.year+'-'+tp.month];
					});
				}
				if(row.type=='expense'){
					time_periods.forEach(function(tp){
						expense_total[tp.year+'-'+tp.month]+=row.columns[tp.year+'-'+tp.month];
					});
				}
			})
			locals.pnl.rows[income_row].columns=income_total;
			locals.pnl.rows[expense_row].columns=expense_total;
			time_periods.forEach(function(tp){
				var surplus=income_total[tp.year+'-'+tp.month]+expense_total[tp.year+'-'+tp.month];
				locals.pnl.rows[surplus_row].columns[tp.year+'-'+tp.month]=surplus	
			})
			res.view('view_pnl',locals);
			
		});
	},
	viewPnL2:function(req,res){
		var locals={
			pnl:{}
		}
		// var month=null,year=null;
		// if(req.query.month){
		//  year=req.query.month.substring(0,4);
		//  month=req.query.month.substring(5,7);
		// }
		// else if(req.query.year)
		//  year= req.query.year.substring(0,4);
		// else{
		//  year=new Date().toISOString().substring(0,4);
		//  month=new Date().toISOString().substring(5,7);
		// }
		if(!req.query.date_from)
			req.query.date_from='2018-04-01';
		if(!req.query.date_to)
			req.query.date_to='2019-04-01';

		async.auto({
			getAccounts:function(callback){
				Account.find({org:req.org.id}).sort('name ASC').exec(callback);
			},
			getAllCategories:function(callback){
				Category.find({org:req.org.id}).exec(callback);
			},
			getPnl:function(callback){
				Pnl.findOne({id:req.params.id}).exec(callback);
			},
			getCategorySpendingPerMonth:['getAccounts',function(results,callback){

				var escape=[req.query.date_from,req.query.date_to];
				var query = 'select count(*),sum(amount_inr),EXTRACT(YEAR FROM "occuredAt") as "year",EXTRACT(MONTH FROM "occuredAt") as "month",category from transaction_line_item';
				query+=' where';
				query+=" type='income_expense'";
				query+= ' AND CAST("occuredAt" AS date) BETWEEN CAST($1 AS date) AND CAST($2 AS date)';
					
				if(_.map(results.getAccounts,'id').length)
					query+=' AND account in '+GeneralService.whereIn(_.map(results.getAccounts,'id'));
				// in the accounts that belong to you
				query+=' group by category, "year", "month"';
				query+=' order by "year" , "month" '
				// console.log(query);
				sails.sendNativeQuery(query,escape,function(err, rawResult) {
					if(err)
						callback(err);
					else
						callback(err,rawResult.rows);
				});
			}],
		},function(err,results){
			if(err)
				throw err;
			
			results.getAllCategories.forEach(function(c){
				c.data={};
			})
			// generate time periods
			var time_periods = PnLService.generateTimePeriods(results.getCategorySpendingPerMonth);
			// calculate category spending per time period
			var categories_by_time = PnLService.calculateCategorySpendingPerTimePeriod(results.getAllCategories, time_periods, results.getCategorySpendingPerMonth);
			// general scafolding for pnl
			locals.pnl = PnLService.generatePnLScafolding(results.getPnl);
			// set headers for this pnl
			time_periods.forEach(function (tp) {
				locals.pnl.header.level_1.push(tp.year + '-' + tp.month);
			});
			// var a = {}
			// console.log(a.name);
			// console.log(a.name.something)
			
			if (results.getPnl.type == 'single_pnl_head') {
				locals.pnl.header.level_2.push(_.find(categories_by_time[locals.pnl.header.level_1[0]], { id: results.getPnl.details.pnl_head_category }).name);
				// generate rows scafolding for single_pnl_heads
				locals.pnl.body = PnLService.generateRowScafoldingForSinglePNLHead(results.getAllCategories, locals.pnl.details.pnl_head_category);
				// filling data
				locals.pnl.body = PnLService.populateDataForSinglePNLHead(locals.pnl.body, categories_by_time, results.getPnl.details.pnl_head_category);
			}else if(results.getPnl.type=='multiple_pnl_heads'){
				categories_by_time[locals.pnl.header.level_1[0]].forEach(function(c){
					if(c.type='pnl_head'){
						locals.pnl.header.level_2.push(c.name);
					}
				})
				// generate rows scafolding for single_pnl_heads
				locals.pnl.body = PnLService.generateRowScafoldingForMultiplePNLHeads(results.getAllCategories);
				// filling data
				locals.pnl.body = PnLService.populateDataForMultiplePNLHeads(locals.pnl.body, categories_by_time);
			}

			res.view('view_sample_pnl',locals);
		});
	},
	deletePnL:function(req,res){
		var locals={}
		res.view('delete_pnl',locals);
	},
	listInvoices:function(req,res){
		var locals={};
		Invoice.find({org:req.org.id}).populate('category').exec(function(err,invoices){
			if(err)
				throw err;
			locals.invoices=invoices;
			res.view('list_invoices',locals);
		})
	},
	viewInvoice:function(req,res){
		var locals={};
		res.view('view_invoices',locals);
	},
	createInvoice:function(req,res){
		Account.find({ org:req.org.id }).exec(function (err, accounts) {
			if (req.body) { // post request
				console.log(req.body);
				const fx = require('money');
				fx.base = 'INR';
				fx.rates = sails.config.fx_rates;
				var invoice = {
					original_currency: req.body.original_currency,
					date: new Date(req.body.date + ' ' + req.body.time + req.body.tz),
					createdBy: 'user',
					description: req.body.description,
					account: req.body.account_id,
					third_party: req.body.third_party,
					type:req.body.type,
					terms:req.body.terms,
					org:req.org.id,
					remote_id:req.body.remote_id,
				}
				if (req.body.type == 'payable') {
					invoice.original_amount = -(req.body.original_amount);
					invoice.amount_inr = -(fx.convert(req.body.original_amount, { from: invoice.original_currency, to: "INR" }));
					invoice.sub_total_inr = -(fx.convert(req.body.sub_total, { from: invoice.original_currency, to: "INR" }));
					invoice.gst_total_inr = -(fx.convert(req.body.gst_total, { from: invoice.original_currency, to: "INR" }));
					invoice.balance_due_inr = -(fx.convert(req.body.balance_due, { from: invoice.original_currency, to: "INR" }));
				} else if (req.body.type == 'receivable') {
					invoice.original_amount = (req.body.original_amount);
					invoice.amount_inr = (fx.convert(req.body.original_amount, { from: invoice.original_currency, to: "INR" }));
					invoice.sub_total_inr = (fx.convert(req.body.sub_total, { from: invoice.original_currency, to: "INR" }));
					invoice.gst_total_inr = (fx.convert(req.body.gst_total, { from: invoice.original_currency, to: "INR" }));
					invoice.balance_due_inr = (fx.convert(req.body.balance_due, { from: invoice.original_currency, to: "INR" }));
				}
				// console.log('before transaction find or create');
				console.log(invoice);
				Invoice.create(invoice).exec(function (err, inv) {
					if (err)
						throw err;
					else {
						res.redirect('/org/' + req.org.id +'/invoices');
					}
				});
			} else { // view the form
				var locals = {
					invoice: {
						date: '',
					},
					accounts:accounts,
				};
				res.view('create_invoice', locals);
			}
			
		})
		
		
	},
	editInvoice:function(req,res){
		Account.find({ org: req.org.id }).exec(function (err, accounts) {
			if (req.body) { // post request
				console.log(req.body);
				const fx = require('money');
				fx.base = 'INR';
				fx.rates = sails.config.fx_rates;
				var invoice = {
					original_currency: req.body.original_currency,
					date: new Date(req.body.date + ' ' + req.body.time + req.body.tz),
					createdBy: 'user',
					description: req.body.description,
					account: req.body.account_id,
					third_party: req.body.third_party,
					type: req.body.type,
					terms: req.body.terms,
					org: req.org.id,
					remote_id: req.body.remote_id,
				}
				// if (req.body.type == 'payable') {
				// 	invoice.original_amount = -(req.body.original_amount);
				// 	invoice.amount_inr = -(fx.convert(req.body.original_amount, { from: invoice.original_currency, to: "INR" }));
				// 	invoice.sub_total_inr = -(fx.convert(req.body.sub_total, { from: invoice.original_currency, to: "INR" }));
				// 	invoice.gst_total_inr = -(fx.convert(req.body.gst_total, { from: invoice.original_currency, to: "INR" }));
				// 	invoice.balance_due_inr = -(fx.convert(req.body.balance_due, { from: invoice.original_currency, to: "INR" }));
				// } else if (req.body.type == 'receivable') {
					invoice.original_amount = (req.body.original_amount);
					invoice.amount_inr = (fx.convert(req.body.original_amount, { from: invoice.original_currency, to: "INR" }));
					invoice.sub_total_inr = (fx.convert(req.body.sub_total, { from: invoice.original_currency, to: "INR" }));
					invoice.gst_total_inr = (fx.convert(req.body.gst_total, { from: invoice.original_currency, to: "INR" }));
					invoice.balance_due_inr = (fx.convert(req.body.balance_due, { from: invoice.original_currency, to: "INR" }));
				// }
				// console.log('before transaction find or create');
				console.log(invoice);
				Invoice.update({id:req.params.i_id},invoice).exec(function (err, invoice) {
					if (err)
						throw err;
					else {
						res.redirect('/org/' + req.org.id + '/invoices');
					}
				});
			} else { // view the form
				Invoice.findOne({id:req.params.i_id}).exec(function(err,invoice){
					invoice.sub_total = (fx.convert(invoice.sub_total_inr, { to: invoice.original_currency, from: "INR" }));
					invoice.gst_total = (fx.convert(invoice.gst_total_inr, { to: invoice.original_currency, from: "INR" }));
					invoice.balance_due = (fx.convert(invoice.balance_due_inr, { to: invoice.original_currency, from: "INR" }));
					if(err)
						throw err;
					var locals = {
						invoice: invoice,
						accounts: accounts,
					};
					res.view('create_invoice', locals);
				})
				
			}

		})
	},
	deleteInvoice:function(req,res){
		var locals = {};
		res.view('delete_invoice', locals);
	},
	listBalanceSheets: function (req, res) {
		var locals = {};
		// Invoice.find({ org:req.org.id }).populate('category').exec(function (err, invoices) {
		// 	if (err)
		// 		throw err;
		// 	locals.invoices = invoices;
		// 	res.view('list_invoices', locals);
		// })
		res.view('list_balance_sheets',locals);
	},
	viewBalanceSheet: function (req, res) {
		var locals = {
			pnl: {}
		}
		if (!req.query.date_from)
			req.query.date_from = '2018-04-01';
		if (!req.query.date_to)
			req.query.date_to = '2019-04-01';

		async.auto({
			getAccounts: function (callback) {
				Account.find({ org: req.org.id }).sort('name ASC').exec(callback);
			},
			getSnapshots:['getAccounts', function (results,callback) {
				var acc_ids=_.map(results.getAccounts,'id');
				Snapshot.find({ id:acc_ids }).exec(callback);
			}],
			getAllCategories: function (callback) {
				Category.find({ org: req.org.id }).exec(callback);
			},
			// getPnl: function (callback) {
			// 	Pnl.findOne({ id: req.params.id }).exec(callback);
			// },
			getBS: function (callback) {
				Balance_sheet.findOne({ id: req.params.id }).exec(callback);
			},
			// getCategorySpendingPerMonth: ['getAccounts', function (results, callback) {

			// 	var escape = [req.query.date_from, req.query.date_to];
			// 	var query = 'select count(*),sum(amount_inr),EXTRACT(YEAR FROM "occuredAt") as "year",EXTRACT(MONTH FROM "occuredAt") as "month",category from transaction_line_item';
			// 	query += ' where';
			// 	query += " type='income_expense'";
			// 	query += ' AND CAST("occuredAt" AS date) BETWEEN CAST($1 AS date) AND CAST($2 AS date)';

			// 	if (_.map(results.getAccounts, 'id').length)
			// 		query += ' AND account in ' + GeneralService.whereIn(_.map(results.getAccounts, 'id'));
			// 	// in the accounts that belong to you
			// 	query += ' group by category, "year", "month"';
			// 	query += ' order by "year" , "month" '
			// 	// console.log(query);
			// 	sails.sendNativeQuery(query, escape, function (err, rawResult) {
			// 		if (err)
			// 			callback(err);
			// 		else
			// 			callback(err, rawResult.rows);
			// 	});
			// }],
		}, function (err, results) {
			if (err)
				throw err;

			results.getAllCategories.forEach(function (c) {
				c.data = {};
			})
			// generate time periods
			// var time_periods = PnLService.generateTimePeriods(results.getCategorySpendingPerMonth);
			// calculate category spending per time period
			// var categories_by_time = PnLService.calculateCategorySpendingPerTimePeriod(results.getAllCategories, time_periods, results.getCategorySpendingPerMonth);
			// general scafolding for pnl
			locals.b_s = BalanceSheetService.generateBSScafolding(results.getBS);
			// set headers for this pnl
			// time_periods.forEach(function (tp) {
			// 	locals.b_s.header.level_1.push(tp.year + '-' + tp.month);
			// });
			locals.b_s.header.level_1.push('2019-04');
			locals.b_s.header.level_2.push('all');
			// var a = {}
			// console.log(a.name);
			// console.log(a.name.something)

			if (results.getBS.type == 'single_pnl_head') {
				// locals.b_s.header.level_2.push(_.find(categories_by_time[locals.b_s.header.level_1[0]], { id: results.getPnl.details.pnl_head_category }).name);
				// // generate rows scafolding for single_pnl_heads
				locals.b_s.body = BalanceSheetService.generateRowScafoldingForSinglePNLHead(results.getAccounts, locals.b_s.details.pnl_head_category);
				// // filling data
				locals.b_s.body.forEach(function (row_l1) { // income, expense, surplus
					var row_l1_sum=0;
					row_l1.children.forEach(function (row_l2) { // bank, wallet, credit_card
						var row_l2_sum = 0;
						row_l2.children.forEach(function (row_l3) { // bank, wallet, credit_card
							row_l2_sum += row_l3.data['2019-04__all'];
						});
						row_l2.data['2019-04__all']=row_l2_sum;
						row_l1_sum += row_l2.data['2019-04__all'];
					});
					row_l1.data['2019-04__all'] = row_l1_sum;
					if (row_l1.name == 'Surplus') { // custom calculation for surplus
						row_l1.data['2019-04__all'] = locals.b_s.body[0].data['2019-04__all'] + locals.b_s.body[1].data['2019-04__all'];
					}
				})
				// locals.b_s.body = BalanceSheetService.populateDataForSinglePNLHead(locals.b_s.body, results.getAccounts, results.getPnl.details.pnl_head_category);
			}
			res.view('view_balance_sheet', locals);
		});
	},
	createBalanceSheet: function (req, res) {
		var locals = {
			sub: {},
			pnl: {},
			status: '',
			message: '',
		}
		if (req.body) {
			var pnl = {
				org: req.org.id,
				name: req.body.name,
				type: 'single_pnl_head',
				details: {
					pnl_head: 1 // id of the category
				}

			}
			Balance_sheet.create(pnl).exec(function (err, result) {
				res.redirect('/org/' + req.org.id + '/balance_sheets');
			})
		} else {
			async.auto({
				getCategories: function (callback) {
					Category.find({ org: req.org.id }).sort('name ASC').exec(callback);
				},
			}, function (err, results) {
				var categories = GeneralService.orderCategories(results.getCategories);
				var head = Math.floor(Math.random() * categories.length);
				locals.pnl.statement = {
					head: [
						{
							cat_id_is: categories[head].id,
							name: categories[head].name
						}
					],
					income: [],
					expense: [],
				}
				categories[head].children.forEach(function (c_cat) {
					if (c_cat.type == "income") {
						locals.pnl.statement.income.push({
							cat_id_id: c_cat.id,
							name: c_cat.name
						});
					} else if (c_cat.type == 'expense') {
						locals.pnl.statement.expense.push({
							cat_id_id: c_cat.id,
							name: c_cat.name
						});
					}
				})
				res.view('create_balance_sheet', locals);
			});
		}
		
	},
	editBalanceSheet: function (req, res) {
		var locals = {};
		res.view('create_balance_sheet', locals);
	},
	deleteBalanceSheet: function (req, res) {
		var locals = {};
		res.view('delete_balance_sheet', locals);
	},
	// list orgs that loggedin user is part of
	listOrgs: function (req, res) {
		var locals = {};
		Member.find({ org:req.org.id }).populate('org').exec(function (err, memberships) {
			if (err)
				throw err;
			locals.memberships = memberships;
			res.view('list_orgs', locals);
		})
	},
	viewOrg: function (req, res) {
		var locals = {};
		res.view('view_org', locals);
	},
	createOrg: function (req, res) {
		var locals = {};
		if(req.body){
			var org= req.body;
			org.owner=req.user.id;
			Org.create(org).exec(function(err){
				if(err)
					throw(err);
				res.redirect('/orgs');
			})
		}else{
			locals.org={};
			res.view('create_org', locals);
		}
	},
	editOrg: function (req, res) {
		var locals = {};
		res.view('create_org', locals);
	},
	deleteOrg: function (req, res) {
		var locals = {};
		res.view('delete_org', locals);
	},
	listMembers: function (req, res) {
		var locals = {};
		Member.find({ org:req.params.o_id }).populate('user').populate('org').exec(function (err, members) {
			if (err)
				throw err;
			locals.members = members;
			res.view('list_members', locals);
		});
	},
	viewMember: function (req, res) {
		var locals = {};
		res.view('view_member', locals);
	},
	createMember: function (req, res) {
		var locals = {};
		if(req.body){
			var member= req.body;
			member.org = req.params.o_id;
			Member.create(member).exec(function(err){
				if(err)
					throw err;
				res.redirect('/org/'+req.params.o_id+'/members');
			})
		}else{
			User.find().sort('name asc').exec(function(err,users){
				locals.users=users;
				locals.member={};
				res.view('create_member', locals);
			})
			
		}
	},
	editMember: function (req, res) {
		var locals = {};
		res.view('create_member', locals);
	},
	deleteMember: function (req, res) {
		var locals = {};
		res.view('delete_member', locals);
	},
}