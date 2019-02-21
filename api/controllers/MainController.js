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
fx.rates=sails.config.fx_rates;

var temp_count = 10;

var request = require("request");
var jwt = require("jsonwebtoken");
module.exports = {
	landingPage:function(req,res){
		if(req.user)
			res.redirect('/dashboard');
		else 
			res.redirect('/login')
	},
	listCategories:function(req,res){
		Category.find({user:req.user.id}).sort('name ASC').exec(function(err,categories){
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
				c.user = req.user.id
			});

			Category.create(req.body).exec(function(err, cats){
				if(err)
					return res.status(500).json({error: err.message})
				return res.json(cats);
			});
		}
		else{

			Category.find({user:req.user.id}).exec(function(err,categories){
			if(req.body){ // post request
				if(!req.body.budget)
					req.body.budget='10000';
				var c={
					name:req.body.name,
					description:req.body.description,
					budget:parseInt(req.body.budget),
					user:req.user.id,
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
						res.redirect('/categories');
				});
			}else{ // view the form
				var locals={
					status:'',
					message:'',
					name:'',
					description:'',
					budget:'10000',
					parent_id:0,
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
				Account.find({user:req.user.id}).exec(callback)
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
		Category.find({user:req.user.id}).exec(function(err,categories){
			if(!_.find(categories,{id:parseInt(req.params.id)}))
				return res.send('you dont have permission to modify this category');
			if(req.body){
				var c={
					name:req.body.name,
					description:req.body.description,
					budget:parseInt(req.body.budget),
					user:req.user.id,
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
						res.redirect('/categories');
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
					categories:categories
				}
				res.view('create_category',locals);
			}
		});
	},
	deleteCategory:function(req,res){
		async.auto({
			getCategory:function(callback){
				Category.findOne({id:req.params.id,user:req.user.id}).populate('parent').exec(callback);
			},
			getTransactionsCount:function(callback){
				Transaction.count({category:req.params.id}).exec(callback);
			},
			getChildrenCategories:function(callback){
				Category.find({parent:req.params.id,user:req.user.id}).exec(callback);
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
					res.redirect('/categories');
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
		Email.find({user:req.user.id}).exec(function(err,emails){
			var locals={
				emails:emails
			}
			res.view('list_emails',locals);
		});
	},
	createEmailManual:function(req,res){
		if(req.body){ // post request
 			var e={
 				email:req.body.email,
 				token:req.body.token,
 				user:req.user.id,
 			}
 			// console.log('before transaction find or create');
 			console.log(e);
 			Email.create(e).exec(function(err,transaction){
 				if(err){
 					console.log(err);
 					throw err;
 				}
 				else
 					res.redirect('/emails');
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
	createEmail:function(req,res){
		const {google} = require('googleapis');
		const {client_secret, client_id, redirect_uris} = sails.config.gmail.installed;
		const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[1]);
		const authorizeUrl = oAuth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: [
				'https://www.googleapis.com/auth/gmail.readonly',
				// 'https://www.googleapis.com/auth/plus.me',
				'https://www.googleapis.com/auth/userinfo.email'
				],
			state: req.user.id,
		});
		res.redirect(authorizeUrl);
	},
	oauth2callback:function(req,res){
		var Base64 = require('js-base64').Base64;
		const {google} = require('googleapis');
		const {client_secret, client_id, redirect_uris} = sails.config.gmail.installed;
		const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[1]);

		// console.log('\n\n--------');
		// console.log(req.query.code);
		// console.log(req.query.state);
		oAuth2Client.getToken(req.query.code).then(function(result){
			// console.log(result.tokens);
			// console.log(result.tokens.id_token);
			// console.log(result.tokens.id_token.split('.'));
			// console.log(result.tokens.id_token.split('.')[1]);
			Base64.extendString();
			var id_token_data = JSON.parse(result.tokens.id_token.split('.')[1].fromBase64());
			console.log(result.tokens);
			var email={
				user:req.query.state, // user id is passed into this variable
				email:id_token_data.email,
				token:result.tokens,
				details: {token_status: 'active'}
			}
			console.log(email);
			Email.findOrCreate({email:email.email},email).exec(function(err,result){
				console.log(err);
				res.redirect('/emails');
			})
		})
	},
	editEmail:function(req,res){
	},
	viewEmail:function(req,res){
	},
	
	listAccounts:function(req,res){
		Account.find({user:req.user.id}).exec(function(err,accounts){
			var locals={
				accounts:accounts
			}
			res.view('list_accounts',locals);
		})
	},
	viewAccount:function(req,res){
		Account.findOne({id:req.params.id,user:req.user.id}).exec(function(err,account){
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
				user:req.user.id,
			}
			// console.log('before transaction find or create');
			console.log(a);
			Account.create(a).exec(function(err,transaction){
				if(err)
					throw err;
				else
					res.redirect('/accounts');
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
				user:req.user.id,
			}
			// console.log('before transaction find or create');
			// console.log(a);
			Account.update({id:req.params.id},a).exec(function(err,account){
				if(err)
					throw err;
				else
					res.redirect('/accounts');
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
				Account.find({user:req.user.id}).sort('name ASC').exec(callback);
			},
			getCategories:function(callback){
				Category.find({user:req.user.id}).exec(callback);
			},
			getTransactionsWithOutDescription: ['getAccounts', function(results, callback){
				var  accounts =  _.map(results.getAccounts,'id')
				Transaction.findOne({description: {'!': null }, account:accounts}).exec(callback);
			}],
			getDocumentsCount: function(callback){
				Document.count({user:req.user.id}).exec(callback);
			},
			getEmailCount: function(callback){
				Email.count({user:req.user.id}).exec(callback);
			},
			getCategorySpending:['getAccounts',function(results,callback){

				var escape=[year];
				var query = 'select count(*),sum(amount_inr),category from transaction';
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
				Transaction.query(query,escape,function(err, rawResult) {
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
				Snapshot.query(query,escape,function(err, rawResult) {
					if(err)
						callback(err);
					else
						callback(err,rawResult.rows);
				});
			}],
			getExpenseChartData:['getAccounts',function(results,callback){
				var escape=[year];
				var query = 'select count(*),sum(amount_inr),EXTRACT(Day from "occuredAt") as day from transaction';
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
				Transaction.query(query,escape,function(err, rawResult) {
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
				description: results.getTransactionsWithOutDescription? 'completed':'disabled',
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
				datasets:[],
			};
			locals.chart3={
				datasets:[],
			};
			results.getAccounts.forEach(function(account,i){
				var colors = ['teal','blue','red','green','violet','orange','black','brown'];
				var dataset2 ={
					label: account.name,
					backgroundColor: colors[i],
					borderColor: colors[i],
					data: [],
					fill: false,
				}
				var dataset3 ={
					label: account.name,
					backgroundColor: colors[i],
					borderColor: colors[i],
					data: [],
					fill: false,
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
				Account.find({user:req.user.id}).exec(callback);
			},
			getDocuments:function(callback){ // only for filter
				Document.find({user:req.user.id}).sort('createdAt DESC').exec(callback);
			},
			getTransactionsInDocument:function(callback){
				if(req.query.document){
					Statement_line_item.find({document:req.query.document}).exec(callback);
				}else
					callback(null);
			},
			getTransactions:['getAccounts','getTransactionsInDocument',function(results,callback){
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

				Transaction.find(filter).sort(sort).limit(limit).populate('tags').exec(callback);
			}],
			getCategories:function(callback){
				Category.find({user:req.user.id}).exec(callback);
			},
			getTags:function(callback){
				Tag.find({user:req.user.id}).exec(callback);
			},
			getParsedEmails:['getTransactions',function(results,callback){
				var t_ids=_.map(results.getTransactions,'id');
				Parsed_email.find({transaction:t_ids}).exec(callback);
			}],
			getSLIs:['getTransactions',function(results,callback){
				var t_ids=_.map(results.getTransactions,'id');
				Statement_line_item.find({transaction:t_ids}).populate('document').exec(callback);
			}]
		},function(err,results){
			if (err)
				throw err;
			locals.transactions=results.getTransactions;
			var accounts=results.getAccounts;
			locals.transactions.forEach(function(t){
				accounts.forEach(function(account){ // expanding account in the transaction object
					if(t.account==account.id)
						t.account=account;
					if(t.to_account==account.id)
						t.to_account=account;
				});
				t.parsed_emails=[];
				// console.log(results.getParsedEmails);
				results.getParsedEmails.forEach(function(pe){
					if(t.id == pe.transaction)
						t.parsed_emails.push(pe);
				})
				t.slis=[];
				results.getSLIs.forEach(function(sli){
					if(t.id==sli.transaction)
						t.slis.push(sli);
				})
				var moment = require('moment-timezone');
				t.occuredAt=moment(t.occuredAt).tz('Asia/Kolkata').format();
			})
			// locals.categories=GeneralService.orderCategories(results.getCategories);
			locals.accounts=results.getAccounts;
			locals.tags=results.getTags;
			locals.documents=results.getDocuments;
			locals.categories=GeneralService.orderCategories(results.getCategories);
			locals.moment=require('moment-timezone');
			res.view('list_transactions',locals);
			
		});
	},
	createTransaction:function(req,res){
		Account.find({user:req.user.id}).exec(function(err,accounts){
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
							res.redirect('/transactions');
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
	editTransaction:function(req,res){
		Account.find({user:req.user.id}).exec(function(err,accounts){
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
						res.redirect('/transactions');
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
				res.redirect('/transactions');
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
		if(req.body.t){
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
		}else if(req.body.doc){
			Document.findOne({id:req.body.doc}).exec(function(err,doc){
				if(doc.user==req.user.id){
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
						res.redirect('/snapshots');
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
		Account.find({user:req.user.id}).exec(function(err,accounts){
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
						res.redirect('/snapshots');
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
				res.redirect('/snapshots');
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
		Document.find({user:req.user.id}).populate('accounts').populate('statement_line_items').sort('id DESC').exec(function(err,documents){
			var timeline = {
				groups:[],
				items:[]
			}

			_.forEach(documents, function(d){
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
				documents:documents,
				moment: require('moment-timezone'),
				timeline: timeline
			}
			res.view('list_documents',locals);
		})
	},
	viewDocument:function(req,res){
		async.auto({
			getDoc:function(callback){
				Document.findOne({id:req.params.id, user:req.user.id}).exec(callback);
			},
			getSLIs:function(callback){
				Statement_line_item.find({document:req.params.id}).populate('transaction').sort('pos ASC').exec(callback);
			},
			getDoubtfulTransactions:['getSLIs',function(results,callback){
				Doubtful_transaction.find({sli:_.map(results.getSLIs,'id')}).exec(callback);
			}],
			getAccounts:function(callback){
				Account.find({user:req.user.id}).exec(callback);
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
					req.file('file').upload({
						adapter: require('skipper-s3'),
						key: sails.config.aws.key,
						secret: sails.config.aws.secret,
						region: sails.config.aws.region,
						bucket: sails.config.aws.bucket,
						headers: {
							"content-type": req.file('file')._files[0].stream.headers['content-type']
						}
					}, function (err, uploadedFiles) {
						if (err) return cb(err);
						cb(null, uploadedFiles)
					});
				}],
				createDocument: ['uploadFileToS3', function (results, cb) {
					Document.create({ user: req.user.id, parser_used: req.body.type, details:{s3:results.uploadFileToS3[0].fd, original_filename:results.uploadFile[0].filename} }).exec(cb);
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
				 	return res.redirect("/documents");
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
		Tag.find({user:req.user.id}).exec(function(err,tags){
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
				user:req.user.id,
				type:'user',
			}
			console.log(t);
			Tag.create(t).exec(function(err,transaction){
				if(err){
					console.log(err);
					throw err;
				}
				else
					res.redirect('/tags');
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
		Tag.findOne({user:req.user.id,id:req.params.id}).exec(function(err,tag){
			if(err)
				throw err;
			if(!tag)
				return res.send('No tag with this id or you dont have permission to edit this tag');
			console.log(tag);
			if(req.body){ // post request
				var t={
					name:req.body.name,
					description:req.body.description,
					user:req.user.id,
				}
				console.log(t);
				Tag.update({id:req.params.id},t).exec(function(err,transaction){
					if(err)
						throw err;
					else
						res.redirect('/tags');
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
				Tag.find({user:req.user.id}).exec(callback);
			},
			getTransaction:function(callback){
				// console.log(req.body);
				Transaction.findOne({id:req.body.t_id}).populate('tags').exec(callback);
			},
		},function(err,results){
			var all_tags=results.getAllTags;
			var old_tags=results.getTransaction.tags;
			var new_tags=req.body.new_tags;
			
			var t = results.getTransaction;
			all_tags.forEach(function(a_tag){
				var action='remove';
				new_tags.forEach(function(new_tag){
					if(a_tag.id==new_tag)
						action='add';
				})
				// console.log('\n-----');
				// console.log(a_tag.name,a_tag.id,action);
				
				if(action=='add')
					t.tags.add(a_tag.id);
				else
					t.tags.remove(a_tag.id);
			});
			// console.log(t);
			t.save(function(err) {
				// console.log(t);
				Transaction.findOne({id:req.body.t_id}).populate('tags').exec(function(err,new_t){
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
	}
}