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
const moment = require('moment-timezone');
const s3Zip = require('s3-zip');

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

			Category.find({ org: req.org.id }).sort('name ASC').exec(function(err,categories){
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
					categories:GeneralService.orderCategories(categories)
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
		Category.find({ org: req.org.id }).sort('name ASC').exec(function(err,categories){
			if(!_.find(categories,{id:parseInt(req.params.id)}))
				return res.send('you dont have permission to modify this category');
			if(req.body){
				var c={
					name:req.body.name,
					description:req.body.description,
					budget:parseInt(req.body.budget),
					org:req.org.id,
					type:req.body.type,
					parent:null,
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
					categories:GeneralService.orderCategories(categories)
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
			getTransactionCategoriesCount:function(callback){
				Transaction_category.count({category:req.params.id}).exec(callback);
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
					getTrasactionCategories:function(callback){
						Transaction_category.find({category:req.params.id}).exec(callback);
					},
					updateTransactionCategories:['getTrasactionCategories',function(results,callback){
						var t_ids=_.map(results.getTrasactionCategories,'id');
						Transaction_category.update({id:t_ids},{category:null}).exec(callback);
					}],
					deleteCategory:['updateTransactionCategories',function(results,callback){
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
					transaction_categories_count:results.getTransactionCategoriesCount,
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
	listParseFailures:function(req,res){
		var limit = req.query.limit?parseInt(req.query.limit): 25;
		var page = req.query.page?parseInt(req.query.page):1;
		var skip = limit * (page-1);
		async.auto({
			getParseFailures:function(callback){
				Parse_failure.find({org:req.params.o_id})
					.sort('createdAt DESC')
					.limit(limit)
					.skip(skip)
					.exec(callback);
			},
		},function(err,results){
			var locals={
				parse_failures:results.getParseFailures,
				page: page,
				limit:limit,
			}
			res.view('list_parse_failures',locals);
		})
	},
	viewParseFailure:function(req,res){
		Parse_failure.findOne({org:req.params.o_id,id:req.params.pf_id}).exec(function(err,pf){
			var locals={
				pf:pf
			}
			res.view('view_parse_failure',locals);
		})
	},
	listParsedEmails:function(req,res){
		var limit = req.query.limit?parseInt(req.query.limit): 25;
		var page = req.query.page?parseInt(req.query.page):1;
		var skip = limit * (page-1);
		async.auto({
			getParsedEmails:function(callback){
				Parsed_email.find({org:req.params.o_id})
					.populate('transaction')
					.sort('createdAt DESC')
					.limit(limit)
					.skip(skip)
					.exec(callback);
			},
			getTransactionCategories:['getParsedEmails',function(results,callback){
				var t_ids=_.map(results.getParsedEmails,'transaction.id');
				Transaction_category.find({transaction:t_ids}).populate('tags').populate('account').exec(callback);
			}],
			getCategories:function(callback){
				Category.find({org:req.params.o_id}).sort('name ASC').exec(callback);
			},
			getTags:function(callback){
				Tag.find({org:req.params.o_id}).sort('name ASC').exec(callback);	
			}
		},function(err,results){
			var categories= GeneralService.orderCategories(results.getCategories);
			results.getTransactionCategories.forEach(function(tc){
				categories.forEach(function(cat){
					if(tc.category==cat.id)
						tc.category_name=cat.name;
				})
			})
			results.getParsedEmails.forEach(function(pe){
				if(pe.transaction){
					pe.transaction.tcs=[];
					results.getTransactionCategories.forEach(function(tc){
						if(tc.transaction==_.get(pe, 'transaction.id')){
							pe.transaction.tcs.push(tc);
						}
					});
				}
			})
			var locals={
				parsed_emails:results.getParsedEmails,
				transaction_categories:results.getTransactionCategories,
				categories:GeneralService.orderCategories(results.getCategories),
				tags:results.getTags,
				page: page,
				limit:limit,
			}
			res.view('list_parsed_emails',locals);
		})
	},
	viewParsedEmail:function(req,res){
		Parsed_email.findOne({org:req.params.o_id,id:req.params.pe_id}).exec(function(err,pe){
			var locals={
				pe:pe
			}
			res.view('view_parsed_email',locals);
		})
	},
	retryParsedEmail: function(req, res){
		async.auto({
			getParsedEmail: function(cb){
				Parsed_email.findOne({id: req.params.id, org:req.org.id}).exec(function(err, pe){
					if(err) return cb(err);
					if(!pe || !_.get(pe, 'details.inbound')) return cb(new Error("NOT_FOUND"));
					return cb(null, pe);
				});
			},
			reParse: ['getParsedEmail', function(results, cb){
				var opts = {
					email_type: results.getParsedEmail.type,
					body: results.getParsedEmail.details.inbound['body-plain']
				}
				GmailService.extractDataFromMessageBody(opts, cb);
			}],
			updateParsedEmail: ['reParse', function(results, cb){
				var to_update = _.pick(results.getParsedEmail, ['email', 'body_parser_used', 'data','extracted_data'])
				to_update.extracted_data =  results.reParse.ed
				to_update.body_parser_used =  results.reParse.body_parser_used
				to_update.extracted_data.email_received_time = new Date(results.getParsedEmail.details.inbound['Date']);

				// apply before filter
				sails.config.emailparser.beforeModifyData(to_update);
				// apply particular filter
				var filter = _.find(sails.config.emailparser.filters, {name: results.getParsedEmail.type});
				if(filter.modifyData)
					filter.modifyData(to_update);
				// apply after modify 
				sails.config.emailparser.afterModifyData(to_update);
				Parsed_email.update({ message_id: results.getParsedEmail.message_id }, to_update)
				.exec(function(err, pe){
					cb(err, pe);
				})
			}],
			getAccount:['updateParsedEmail', function(results, callback){
				var pe = results.updateParsedEmail[0]
				var find = {
					acc_number:{
						endsWith: pe.data.acc_number, // ends with the following number
					},
					org:pe.org
				}

				var create={ // incase the account does not exist, create account.
					acc_number:''+pe.data.acc_number,
					org:pe.org,
					type:'bank', // user might need to change this
					name:'Auto generated account'+pe.data.acc_number,
				} 
				Account.findOrCreate(find, create).exec(function(err, result, created){
					callback(err,result);
				});
			}],
			findOrCreateTransaction:['updateParsedEmail', 'getAccount',function(results,callback){
				//skip if it only contains information about account balance.
				var pe = results.updateParsedEmail[0]

				if(pe.data.type=='balance')
					return callback(null);
				const fx = require('money');
				fx.base='INR';
				fx.rates=sails.config.fx_rates;
				var occuredAt = _.get(pe, 'data.occuredAt', new Date());
				var t={
					original_currency:pe.data.currency,
					createdBy:'parsed_email',
					type: pe.data.type,
					account:results.getAccount.id,
					third_party: _.get(pe, 'data.third_party', null),
					original_amount: _.get(pe, 'data.original_amount', 0),
					amount_inr: _.get(pe, 'data.amount_inr', 0),
					occuredAt: _.isDate(occuredAt) ? occuredAt.toISOString() : occuredAt
				}

				if(pe.transaction)
					Transaction.update({id:pe.transaction}, t).exec(function(err, txn){
						if(err) return callback(err);
						return callback(null, txn[0]);
					});
				else
					Transaction.findOrCreate(t, t).exec(function(err, txn){callback(err, txn);});
			}],
			updateTransactionCategory: ['findOrCreateTransaction', function(results, callback){
				var pe = results.updateParsedEmail[0]
				var tc = {
					original_currency:pe.data.currency,
					type: pe.data.type,
					account:results.getAccount.id,
					third_party: _.get(pe, 'data.third_party', null),
					original_amount: _.get(pe, 'data.original_amount', 0),
					amount_inr: _.get(pe, 'data.amount_inr', 0),
					occuredAt: _.get(pe, 'data.occuredAt', new Date())
				}
				//update tc if this transaction contains only one tc
				Transaction_category.find({transaction: results.findOrCreateTransaction.id}).exec(function(err, tcs){
					if(err) return callback(err);
					if(tcs.length == 1)
						Transaction_category.update({id: tcs[0].id}, tc).exec(callback)
					else
						return callback(null);
				})
			}],
			updateParsedEmailWithTxnId:['findOrCreateTransaction',function(results,callback){
				var pe = results.updateParsedEmail[0]
				//skip if it only contains information about account balance.
				if(pe.data.type=='balance')
					return callback(null);
				Parsed_email.update({id:pe.id},{transaction:results.findOrCreateTransaction.id}).exec(callback);
			}],
			createSnapshotIfPossible:['getAccount',function(results,callback){
				var pe = results.updateParsedEmail[0]
				// console.log('create snapshot');
				if(pe.data.balance_currency && pe.data.balance_amount){
					var ss={
						account:results.getAccount.id,
						createdBy:'parsed_email',
						balance:pe.data.balance_amount,
						takenAt: pe.data.occuredAt
					}
					Snapshot.find(ss).exec(function(err, snaps){
						if(err) return callback(err);
						if(snaps & snaps.length) return callback(null);
						Snapshot.create(ss).exec(callback)
					});
				}else if(pe.data.credit_limit_currency && pe.data.credit_limit_amount && pe.data.available_credit_balance){
					var ss={
						account:results.getAccount.id,
						createdBy:'parsed_email',
						balance:pe.data.available_credit_balance-pe.data.credit_limit_amount,
						takenAt: pe.data.occuredAt
					}
					Snapshot.find(ss).exec(function(err, snaps){
						if(err) return callback(err);
						if(snaps & snaps.length) return callback(null);
						Snapshot.create(ss).exec(callback)
					});
				}else{
					callback(null);
				}
			}],
			
		}, function(err, results){
			if(err){
				switch (err.message) {
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
		var start_of_month = new Date(year+'-'+month+'-'+1);
		var end_of_month = moment(start_of_month).endOf('month').toDate();

		async.auto({
			getAccounts:function(callback){
				Account.find({org:req.org.id}).sort('name ASC').exec(callback);
			},
			getCategories:function(callback){
				Category.find({org:req.org.id}).exec(callback);
			},
			getTransactionCategoriesWithOutDescription: ['getAccounts', function(results, callback){
				var accounts =  _.map(results.getAccounts,'id')
				Transaction_category.count({description: null, account:accounts, occuredAt:{'<':end_of_month, '>':start_of_month}}).exec(callback);
			}],
			getTransactionCategoriesWithOutCategory: ['getAccounts', function(results, callback){
				var accounts =  _.map(results.getAccounts,'id')
				Transaction_category.count({category: null, account:accounts, occuredAt:{'<':end_of_month, '>':start_of_month}}).exec(callback);
			}],
			getStatementsCount: function(callback){
				Statement.count({org:req.org.id}).exec(callback);
			},
			getAccountsWhereStatementsArePresentForThatMonth: ['getAccounts', function(results, callback){
				var query = `WITH sli AS (
					SELECT
						(data ->> 'date') AS sli_date,
						statement,
						statement_line_item.id,
						account_statements__statement_accounts.account_statements as account,
						org,
						statement_line_item."createdAt"
					FROM
						statement_line_item left JOIN account_statements__statement_accounts on account_statements__statement_accounts.statement_accounts = statement_line_item."statement"
				)
				SELECT
					account
				FROM
					sli where "createdAt"::date > '2019-05-01'::date and sli_date::date < '${end_of_month.toISOString().substring(0,10)}'::date AND sli_date::date > '${start_of_month.toISOString().substring(0,10)}'::date GROUP by sli.account;`
				
				sails.sendNativeQuery(query, function(err, rawResult){
					if(err)
						callback(err);
					else
						callback(err,rawResult.rows);
				})
			}],
			getCategorySpending:['getAccounts',function(results,callback){

				var escape=[year];
				var query = 'select count(*),sum(amount_inr),category from transaction_category';
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
			}]
		},function(err,results){
			if(err){
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
						cat.t_sum=-(spend.sum);
					}
				})
				// console.log(cat);
			});

			var locals={
				current:year+'-'+month,
				accounts:results.getAccounts,
				categories:GeneralService.orderCategories(results.getCategories),
				transaction_categories_without_category: results.getTlisWithOutCategory,
				transaction_categories_without_description: results.getTlisWithOutDescription,
				start_of_month: start_of_month,
				end_of_month: end_of_month
			}

			locals.accounts_for_which_statements_missing = _.filter(locals.accounts, function(a){
				if(a.type == 'wallet' || a.type == 'investment' || a.type == 'cash' || a.acc_number.includes('amazon_pay'))
					return false;
				if(results.getAccountsWhereStatementsArePresentForThatMonth.indexOf(a.id) == -1)
					return true;
			});
			
			if(month==1)		
 				locals.prev=(parseInt(year)-1)+'-12';		
 			else		
 				locals.prev=year+'-'+(parseInt(month)-1)		

  			if(month==12)		
 				locals.next=(parseInt(year)+1)+'-1'		
 			else		
 				locals.next=year+'-'+(parseInt(month)+1);
			
			res.view('dashboard',locals);
		})

	},
	setupChecklist: function(req, res){
		
	},
	listTransactions:function(req,res){
		var locals={};
		//pagination

		var limit = req.query.limit?parseInt(req.query.limit): 25;
		var page = req.query.page?parseInt(req.query.page):1;
		var skip = limit * (page-1);
		var transaction_category_filter;

		locals.page = page;
		locals.limit = limit;

		async.auto({
			getAccounts:function(callback){
				Account.find({org:req.org.id}).exec(callback);
			},
			getStatements:function(callback){ // only for filter
				Statement.find({org:req.org.id}).sort('createdAt DESC').exec(callback);
			},
			getTransactionsInStatement:function(callback){
				if(req.query.statement){
					Statement_line_item.find({statement:req.query.statement}).exec(callback);
				}else
					callback(null);
			},
			getCategories:function(callback){
				Category.find({org:req.org.id}).sort('name ASC').exec(callback);
			},
			getTransactionCategories:['getAccounts','getTransactionsInStatement','getCategories', function(results,callback){
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
				if(req.query.statement){
					filter.transaction=_.filter(_.map(results.getTransactionsInStatement,'transaction'));
					console.log(filter.id);
				}
				// category filter
				if(!_.isNaN(parseInt(req.query.category)))
					filter.category=[parseInt(req.query.category)];
				// include sub categoriess	
				if(req.query.include_subcategories == 'true'){
					_.forEach(results.getCategories, function(c){
						if(c.parent == req.query.category)
							filter.category.push(c.id);
					})
				}
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
				
				// id corresponds to transaction id not tcs
				if(req.query.ids){
					filter.transaction = {in: _.map(req.query.ids.split(','), function (each) {
						if(parseInt(each))
							return parseInt(each);
					})}
				}
				transaction_category_filter = filter;
				Transaction_category.find(filter).sort(sort).limit(limit).skip(skip).populate('tags').populate('transaction').populate('documents').exec(callback);
			}],
			getTransactionCategoriesCount: ['getTransactionCategories', function(results, callback){
				Transaction_category.count(transaction_category_filter).exec(callback);
			}],
			getTags:function(callback){
				Tag.find({or:[{org:req.org.id}, {type:'global'}]}).exec(callback);
			},
			getTransactions:['getTransactionCategories',function(results,callback){
				var t_ids=_.map(results.getTransactionCategories,function(tc){return tc.transaction.id});
				Transaction.find({id:t_ids}).sort('occuredAt DESC').exec(callback);
			}],
			getParsedEmails:['getTransactionCategories',function(results,callback){
				var t_ids=_.map(results.getTransactionCategories,function(tc){return tc.transaction.id});
				Parsed_email.find({transaction:t_ids}).exec(callback);
			}],
			getSLIs:['getTransactionCategories',function(results,callback){
				var t_ids=_.map(results.getTransactionCategories,function(tc){return tc.transaction.id});
				Statement_line_item.find({transaction:t_ids}).populate('statement').exec(callback);
			}]
		},function(err,results){
			if (err)
				throw err;
			locals.transaction_categories = results.getTransactionCategories
			locals.pages = Math.ceil(parseFloat(results.getTransactionCategoriesCount/limit)? parseFloat(results.getTransactionCategoriesCount/limit) : 1);
			var accounts=results.getAccounts;
			locals.transactions=results.getTransactions;
			locals.transactions.forEach(function(t){
				t.tcs=[];
				accounts.forEach(function(account){ // expanding account in the transaction object
					if(t.account==account.id)
						t.account=account;
					if(t.to_account==account.id)
						t.to_account=account;
				});
				t.parsed_emails=[];
				results.getParsedEmails.forEach(function(pe){
					if(t.id == pe.transaction)
						t.parsed_emails.push(pe);
				});
				t.slis=[];
				results.getSLIs.forEach(function(sli){
					if(t.id==sli.transaction)
						t.slis.push(sli);
				});
			});

			locals.download_documents = '/org/' + req.org.id + '/documents'+ '?download=true&ids=';

			locals.transaction_categories.forEach(function(tc){
				accounts.forEach(function(account){ // expanding account in the transaction object
					if(tc.account==account.id)
						tc.account=account;
					if(tc.to_account==account.id)
						tc.to_account=account;
				});

				var moment = require('moment-timezone');
				tc.occuredAt=moment(tc.occuredAt).tz('Asia/Kolkata').format();
				var t = _.find(locals.transactions,{ id:tc.transaction.id });
				t.tcs.push(tc);

				//append document ids to download url
				_.forEach(tc.documents, function(d){
					locals.download_documents = locals.download_documents + d.id + ','
				})
			})
			
			locals.accounts=results.getAccounts;
			locals.tags=results.getTags;
			locals.statements=results.getStatements;
			locals.categories=GeneralService.orderCategories(results.getCategories);
			locals.moment=require('moment-timezone');
			locals.query_string=require('query-string');

			if(req.query.download_csv=='true'){
				const json2csv = require('json2csv').parse;
				const csvString = json2csv(locals.ts);
				res.setHeader('Content-disposition', 'attachment; filename=transactions-filtered.csv');
				res.set('Content-Type', 'text/csv');
				res.status(200).send(csvString);
			}
			else
				res.view('list_transactions',locals);
		});
	},
	createTransaction: async function(req,res){
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
				var tz = req.body.tz ? req.body.tz:"+05:30"
				var t={
					original_currency:req.body.original_currency,
					// original_amount:-(req.body.original_amount),
					// amount_inr:-(fx.convert(req.body.original_amount, {from: req.body.original_currency, to: "INR"})),
					occuredAt: new Date(req.body.date+' '+req.body.time+tz),
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
				Transaction.create(t).exec(async function(err,transaction){
					if(err){
						var locals={
							occuredAt:'',
							status:'error',
							message:err.message,
							description:'',
							original_amount:'',
							original_currency:'',
							third_party:'',
							account_id:'',
							to_account:'',
							accounts:accounts,
							type:'expense',
							balance: '',
							balance_currency: 'INR'
						}
						console.log(locals);
						res.view('create_transaction',locals);
					}	
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
					balance: '',
					balance_currency: 'INR'
				}
				console.log(locals);
				res.view('create_transaction',locals);
			}
		})
	},
	updateTransactionCategory: function(req,res){
		async.auto({
			getTransactionCategory: function(cb){
				Transaction_category.findOne(req.params.id).populate('account').exec(cb)
			},
			updateTransactionCategory: ['getTransactionCategory', function(results, cb){
				if(_.get(results, 'getTransactionCategory.account.org') != req.org.id)
					return cb(new Error('INVALID_ACCESS'));
				Transaction_category.update({id: req.params.id}, req.body).exec(cb);
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
			var updated = _.get(results, 'updateTransactionCategory[0]', {})
			return res.status(200).json(updated)
		})
	},
	viewTransaction:function(req,res){

		async.auto({
			getTransaction:function(callback){
				Transaction.findOne({id:req.params.id}).populate('account').exec(callback);
			},
			getParsedEmails:function(callback){
				Parsed_email.find({transaction:req.params.id}).exec(callback);
			},
			getSLIs:function(callback){
				Statement_line_item.find({transaction:req.params.id}).exec(callback);
			},
			getTransactionCategories:function(callback){
				Transaction_category.find({transaction:req.params.id}).populate('tags').populate('documents').exec(callback);
			},
			getCategories:function(callback){
				Category.find({org:req.params.o_id}).sort('name ASC').exec(callback);
			},
			getTags:function(callback){
				Tag.find({org:req.params.o_id}).sort('name ASC').exec(callback);	
			},
		},function(err,results){
			var locals={
				moment:require('moment-timezone'),
				t:results.getTransaction,
				categories:GeneralService.orderCategories(results.getCategories),
				tags:results.getTags,

			}
			locals.t.parsed_emails=results.getParsedEmails;
			locals.t.slis=results.getSLIs;
			locals.t.tcs=results.getTransactionCategories;
			res.view('view_transaction',locals);
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
						original_amount:t.original_amount,
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
				Transaction_category.destroy({transaction: req.params.id}).exec(function(err,tc){
					if(err)
						throw(err);
					res.redirect('/org/' + req.org.id +'/transactions');
				})
			});
		}else{ // showing the warning page
			Transaction.findOne({id:req.params.id}).populate('account').populate('transaction_categories').exec(function(err,t){
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
	},
	editDescription:function(req,res){
		if(req.body.tc){
			// do you have permission to edit description of that transaction?
			async.auto({
				getAccounts:function(callback){
					Account.find({org:req.org.id}).exec(callback);
				},
				getTransactionCategory:function(callback){
					Transaction_category.findOne({id:req.body.tc}).exec(callback);
				},
			},function(err,results){
				if(err)
					throw err;
				var tc = results.getTransactionCategory;
				var flag=false;
				results.getAccounts.forEach(function(account){
					if(tc.account==account.id) // transaction in account of the user
						flag=true;
				});
				if(flag){
					Transaction_category.update({id:tc.id},{description:req.body.description}).exec(function(err,result){
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
			Statement.findOne({id:req.body.doc}).exec(function(err,doc){
				if(doc.org==req.org.id){
					Statement.update({id:doc.id},{description:req.body.description}).exec(function(err,result){
						if(err)
							throw err;
						else
							res.send('ok');
					});
				}else{
					res.send(400,'you cant edit that statement');
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
	listStatements: function(req, res){
		var locals={};

		//pagination
		var limit = req.query.limit?parseInt(req.query.limit): 20; //default to 20
		var page = req.query.page?parseInt(req.query.page):1;
		var skip = limit * (page-1);

		locals.page = page;
		locals.limit = limit;
		locals.skip = skip

		locals.date_gte = (req.query.date_gte) ? req.query.date_gte: moment().subtract(2, 'years').format('YYYY-MM-DD'); // defaults to 2 years
		locals.date_lte = (req.query.date_lte) ? req.query.date_lte: moment().format('YYYY-MM-DD');
		

		async.auto({
			getAccounts: function(cb){
				Account.find({org:req.org.id}).exec(function(err, accounts){
					if(err) return cb(err);
					locals.accounts = (req.query.account)? GeneralService.whereIn([req.query.account]): GeneralService.whereIn(_.map(accounts,'id'));
					return cb(null, accounts);
				});
			},
			getStatements: ['getAccounts', function(results, cb){
				var filtered_list_statements_query = `
					SELECT
					*
					FROM (
						SELECT
							"statement"."org" AS org,
							"statement"."data" as statement_data,
							"statement"."createdAt" as "statement_createdAt",
							"statement"."type" AS statement_type,
							"statement"."id" AS statement_id,
							"account"."id" AS account_id,
							"account"."name" AS account_name,
							"account"."type" AS account_type,
							"statement"."details" AS statement_details,
							"statement"."description" AS statement_description,
							data ->> 'transactions_from_date' AS transactions_from_date,
							data ->> 'transactions_to_date' AS transactions_to_date
						FROM
							"statement"
						LEFT JOIN account_statements__statement_accounts ON account_statements__statement_accounts.statement_accounts = "statement"."id"
						LEFT JOIN account ON account_statements__statement_accounts.account_statements = account.id
					WHERE
						"statement"."org" = ${req.org.id}
						AND "account_statements__statement_accounts"."account_statements" in ${locals.accounts}
						AND data ->> 'transactions_to_date' > '${locals.date_gte}'
						AND data ->> 'transactions_from_date' < '${locals.date_lte}'
						LIMIT ${locals.limit} OFFSET ${locals.skip}) AS doc
						LEFT JOIN (
							SELECT
								count(*) AS unresolved_dts, sli.statement AS sli_statement_id
							FROM
								doubtful_transaction AS dt
								INNER JOIN statement_line_item AS sli ON dt.sli = sli.id
							WHERE
								sli.org = ${req.org.id}
								AND json_extract_path(dt.details::json, 'status') IS NULL
							GROUP BY
								sli.statement) AS ut ON doc.statement_id = ut.sli_statement_id
							ORDER BY "doc"."statement_data" ->> 'transactions_to_date' DESC`
				sails.sendNativeQuery(filtered_list_statements_query, cb)
			}],
			getStatementsCount: ['getAccounts', function(results, cb){
				var statements_count = `
					SELECT
					count(*)
					FROM (
						SELECT
							"statement"."org" AS org,
							"statement"."data" as statement_data,
							"statement"."type" AS statement_type,
							"statement"."id" AS statement_id,
							"account"."id" AS account_id,
							"account"."name" AS account_name,
							"account"."type" AS account_type,
							"statement"."details" AS statement_details,
							"statement"."description" AS statement_description,
							data ->> 'transactions_from_date' AS transactions_from_date,
							data ->> 'transactions_to_date' AS transactions_to_date
						FROM
							"statement"
						LEFT JOIN account_statements__statement_accounts ON account_statements__statement_accounts.statement_accounts = "statement"."id"
						LEFT JOIN account ON account_statements__statement_accounts.account_statements = account.id
					WHERE
						"statement"."org" = ${req.org.id}
						AND "account_statements__statement_accounts"."account_statements" in ${locals.accounts}
						AND data ->> 'transactions_to_date' > '${locals.date_gte}' 
						AND data ->> 'transactions_from_date' < '${locals.date_lte}') AS doc
						LEFT JOIN (
							SELECT
								count(*) AS unresolved_dts, sli.statement AS sli_statement_id
							FROM
								doubtful_transaction AS dt
								INNER JOIN statement_line_item AS sli ON dt.sli = sli.id
							WHERE
								sli.org = ${req.org.id}
								AND json_extract_path(dt.details::json, 'status') IS NULL
							GROUP BY
								sli.statement) AS ut ON doc.statement_id = ut.sli_statement_id
					`
				sails.sendNativeQuery(statements_count, cb)
			}]
		}, function(err, results){
			if(err) return res.view('500', err);
			
			var timeline = {
				groups:[],
				items:[]
			}

			var nestedGroups = [];
			
			var orginal_statement_s3_keys = []
			_.forEach(results.getStatements.rows, function(d){

				if(d.statement_data && d.transactions_from_date && d.transactions_to_date){
					timeline.items.push({
						id: d.statement_id + '_' + d.account_id,
						content: `${d.statement_id}: ${d.statement_details.original_filename}`,
						start: d.transactions_from_date,
						end: d.transactions_to_date,
						group: d.account_id
					})
					if(!_.find(timeline.groups, {id:d.account_id}))
						timeline.groups.push({
							id: d.account_id,
							type: d.account_type,
							name: d.account_name,
							className: d.account_type,
							content: `<a href=/org/${req.org.id}/account/${d.account_id}>${d.account_name}<a><br>(${d.account_type})`
						});
				}
				if(_.get(d, 'statement_details.s3_key')){
					orginal_statement_s3_keys.push(d.statement_details.s3_key);
					orginal_statement_s3_keys.push('decrypted_' + d.statement_details.s3_key);
				}
			});
			
			//pagination
			locals.pages = parseInt(results.getStatementsCount.rows[0].count/limit)? parseInt(results.getStatementsCount.rows[0].count/limit) : 1;
			locals.statements = results.getStatements.rows;
			locals.moment = require('moment-timezone');
			locals.timeline = timeline;
			locals.accounts = results.getAccounts;

			//build the url for downloading statements
			locals.download_original_statements = _.isEmpty(req.query)? req.url + '?download=true': req.url + '&download=true'
			
			//download statements
			if(req.query.download == "true"){
				//if not statement attached, return 404
				if(!orginal_statement_s3_keys.length)
					return res.status(404).view('404');
				//set the filename
				res.attachment(moment().format('ll') + ' cashflowy statements.zip');
				var s3 = new AWS.S3({
					accessKeyId: sails.config.aws.key,
					secretAccessKey: sails.config.aws.secret,
					region: sails.config.aws.region
				});

				s3Zip
					.archive({ s3:s3, bucket: sails.config.aws.bucket, debug: true}, '', orginal_statement_s3_keys)
					.pipe(res);
				return;
			}
			res.view('list_statements',locals);
		})
	},
	viewStatement:function(req,res){
		async.auto({
			getDoc:function(callback){
				Statement.findOne({id:req.params.id, org:req.org.id}).exec(callback);
			},
			getSLIs:function(callback){
				Statement_line_item.find({statement:req.params.id}).populate('transaction').sort('pos ASC').exec(callback);
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
			res.view('view_statement',locals);
		})
	},
	downloadStatement: async function(req, res){
		var statement = await Statement.findOne({ id: req.params.id, org: req.org.id });
		if (!statement) res.status(404).view('404');

		var fd =  _.get(statement, 'details.s3_key');
		var decrypted_fd = 'decrypted_' + fd;

		var filename = _.get(statement, 'details.original_filename')

		if(!fd || !filename) res.status(404).view('404');
		
		res.attachment(filename);

		// try to download the decrypted file else download the orginal file
		try{
			var downloading = await sails.startDownload(decrypted_fd);
		} catch(err){
			var downloading = await sails.startDownload(fd);
		}
		downloading.pipe(res);
	},
	createStatement: async function(req, res) {
		console.log('req.org:');
		console.log(req.org);
		var statements_string="";
		if (req.method == 'GET') {
			var locals = {
				type: '',
				message: ''
			}
			res.view('create_statement', locals)
		} else {
			var locals = {
				type: '',
				message: ''
			}
			async.auto({
				uploadFiles: function (cb) {
					req.file('file').upload(function (err, uploadedFiles) {
						if (err) return cb(err);
						cb(null, uploadedFiles)
					});
				},
				processFiles:['uploadFiles',function(results,cb){
					async.eachOf(results.uploadFiles,function(u_file,index,callback){
						async.auto({	
							uploadOriginalFileToS3:  function( cb){
								var s3 = new AWS.S3({
									accessKeyId: sails.config.aws.key,
									secretAccessKey: sails.config.aws.secret,
									region: sails.config.aws.region
								});
								var params = {Bucket: sails.config.aws.bucket, 
									Key: _.get(u_file, 'stream.fd'), 
									Body: fs.createReadStream(u_file.fd)
								};
								s3.upload(params, function(err, data) {
									cb(err, data);
								});
							},
							createStatement: ['uploadOriginalFileToS3', function (results, cb) {
								Statement.create({ 
									org: req.org.id, 
									parser_used: req.body.type, 
									details:{
										s3_key:results.uploadOriginalFileToS3.key, 
										original_filename:u_file.filename, 
										s3_location: results.uploadOriginalFileToS3.Location, 
										s3_bucket: results.uploadOriginalFileToS3.Bucket} }).exec(cb);
							}],
							removePassword: ['createStatement', async function(results){
								const pdf = require('pdf-parse');
								const util = require('util');
								const exec = util.promisify(require('child_process').exec);
								var fsExists = util.promisify(require('fs').exists);
			
								var org = await Org.findOne(req.org.id);
			
								var uf = u_file.fd.split('/')
								uf[uf.length -1] = 'decrypted_'+uf[uf.length -1];
								uf = uf.join('/');
			
								// if user enters the password try first
								if(req.body.password)
									try{
										const { stdout, stderr } = await exec(`qpdf -password=${req.body.password} -decrypt ${u_file.fd} ${uf}`);
										console.log('output', stdout, stderr);
									}
									catch(error){
										// pass
										console.log('error', error);
										throw new Error('INVALID_PASSWORD_ENTERED');
									}
			
								//else try saved passwords or no password option
								else{
									for (const sp of _.union(org.details.statement_passwords, [''])) {
										try{
											const { stdout, stderr } = await exec(`qpdf -password=${sp} -decrypt ${u_file.fd} ${uf}`);
											console.log('output', stdout, stderr);
										}
										catch(error){
											// pass
											console.log('error', error);
										}
									}
								}
								console.log('came here, should come after the for loop')
								var decrypted_file_exists = await fsExists(uf);
								if(decrypted_file_exists){
									// if worked
									if(req.body.password){
										org.details.statement_passwords = _.union(org.details.statement_passwords, [req.body.password])
										await Org.update(org.id, {details: org.details});
									}
									return uf;
								}
								else
									throw new Error('PASSWORD_DECRYPTION_FAILED');
							}],
							uploadDecryptedFileToS3: ['removePassword', function(results, cb){
								var s3 = new AWS.S3({
									accessKeyId: sails.config.aws.key,
									secretAccessKey: sails.config.aws.secret,
									region: sails.config.aws.region
								});
								var params = {Bucket: sails.config.aws.bucket, 
									Key: 'decrypted_' + _.get(u_file, 'stream.fd'), 
									Body: fs.createReadStream(results.removePassword)
								};
								s3.upload(params, function(err, data) {
									cb(err, data);
								});
							}],
							sendToDocParser: ['removePassword', function (results, cb) {
				
								var options = {
									method: 'POST',
									url: `https://${sails.config.docparser.api_key}:@api.docparser.com/v1/document/upload/${req.body.type}`,
									json:true,
									formData:
										{
											remote_id: process.env.NODE_ENV + '_' + results.createStatement.id,
											file:
												{
													value: fs.createReadStream(results.removePassword),
													options:
														{
															filename: u_file.filename,
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
							console.log('error:');
							console.log(error);
							console.log('results:==');
							// console.log(results);
							statements_string=statements_string+results.createStatement.id+','
							console.log('statements_string')
							console.log(statements_string)
							callback();

						})
					},function(err){
						cb(err)
					})
						
				

				}]},
				function(error, results){
					var locals ={
						type:'',
						message:''
					};
   
				   if(error){
						locals.message = error.message
						return res.view('create_statement', locals);
				   }
				   else	
				   console.log('flow completed:');
				   console.log();
				   statements_string=statements_string.substring(0, statements_string.length - 1);
					return res.redirect('/org/' + req.org.id +"/statements_status?statements=" + statements_string);
					//    return res.redirect('/org/' + req.org.id +"/statement/" + results.createStatement.id);
			   })
				
				
			
		}
	},

	editStatement:function(req,res){
		res.send('edit a statement here');
	},
	deleteStatement:function(req,res){
		res.send('delete a statement using this');
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
			Tag.create(t).exec(function(err,tag){
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
	viewTag:async function(req,res){
		var tag = await Tag.findOne({id:req.params.id, org: req.org.id});
		if(!tag)
			return res.view('404');
		
		var accounts = await Account.find({org: req.org.id});

		var query = `SELECT sum (case when transaction_category.amount_inr >= 0 then transaction_category.amount_inr else 0 end) as income, sum (case when transaction_category.amount_inr < 0 then transaction_category.amount_inr else 0 end) as expense from transaction_category left JOIN tag_transaction_categories__transaction_category_tags on transaction_category.id = tag_transaction_categories__transaction_category_tags.transaction_category_tags WHERE tag_transaction_categories__transaction_category_tags.tag_transaction_categories = $1 and transaction_category."type" = 'income_expense'`
		var income_expense = (await sails.sendNativeQuery(query, [tag.id])).rows[0];

		var date_filter = `date_trunc('week', NOW()) = date_trunc('week', "transaction_category"."occuredAt"::date)`;
		if(req.query.time_span == 'this-month'){
			date_filter = `date_trunc('month', NOW()) = date_trunc('month', "transaction_category"."occuredAt"::date)`;
		} else if(req.query.time_span == 'this-year'){
			date_filter = `date_trunc('year', NOW()) = date_trunc('year', "transaction_category"."occuredAt"::date)`;
		}
		var filter_query = `SELECT sum (case when transaction_category.amount_inr >= 0 then transaction_category.amount_inr else 0 end) as income, sum (case when transaction_category.amount_inr < 0 then transaction_category.amount_inr else 0 end) as expense from transaction_category left JOIN tag_transaction_categories__transaction_category_tags on transaction_category.id = tag_transaction_categories__transaction_category_tags.transaction_category_tags WHERE tag_transaction_categories__transaction_category_tags.tag_transaction_categories = $1 and transaction_category."type" = 'income_expense' and ` + date_filter
		var filtered_income_expense = (await sails.sendNativeQuery(filter_query, [tag.id])).rows[0];

		var locals = {
			tag: tag,
			total_income: income_expense.income,
			total_expense: income_expense.expense,
			filtered_income: filtered_income_expense.income ? filtered_income_expense.income: 0,
			filtered_expense: filtered_income_expense.expense ? filtered_income_expense.expense: 0,
			metabase: {}
		}
		var questions=[
			{
				url_name:'category_wise_expense',
				question_id:30,
				params:{
					tag_id:""+tag.id,
				}
			},
			{
				url_name:'category_wise_income',
				question_id:31,
				params:{
					tag_id:""+tag.id,
				}
			}
		]
		questions.forEach(function(q){
			var payload = {
				resource: { question: q.question_id },
				params:q.params,
			};
			var token = jwt.sign(payload, sails.config.metabase.secret_key);
			locals.metabase[q.url_name]=sails.config.metabase.site_url + "/embed/question/" + token + "#bordered=true&titled=false";
		});
		res.view('view_tag',locals);
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
				Tag.find({or:[{org:req.org.id},{type:'global'}]}).exec(callback);
			},
			getTransactionCategory:function(callback){
				// console.log(req.body);
				Transaction_category.findOne({id:req.body.tc_id}).populate('tags').exec(callback);
			}
		},function(err,results){
			var org_tag_ids=_.map(results.getAllTags, 'id');
			var requested_tag_ids = _(req.body.new_tags).filter(function(t){return parseInt(t)}).map(function(t){return parseInt(t);}).value()
			var tag_ids_to_replace = _.intersection(org_tag_ids, requested_tag_ids)
			Transaction_category.replaceCollection(results.getTransactionCategory.id, 'tags').members(tag_ids_to_replace).exec(function(err, txn){
				Transaction_category.findOne({id:req.body.tc_id}).populate('tags').exec(function(err,new_t){
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
			},
			getTags: function(cb){
				Tag.find({or:[{org:req.org.id},{type:'global'}]}).exec(cb);
			},
			getCategories: function(callback){
				Category.find({org:req.org.id}).sort('name ASC').exec(callback);
			}
		},function(err, results){
			if(err) return res.serverError(err);
			if(!results.findRule) return res.view('404');
			var orderedCategories=GeneralService.orderCategories(results.getCategories);

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
						accounts: results.getAccounts,
						tags: results.getTags,
						categories: orderedCategories
					}
					res.view('create_rule', locals);
				})
			}else{
				var locals = {
					rule: results.findRule,
					accounts: results.getAccounts,
					tags: results.getTags,
					categories: orderedCategories
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
			getInvoices:['getPnl',function(results,callback){
				var filter = { 
					org: req.org.id,
					date: {
						'<': req.query.date_to,
						'>': req.query.date_from,
					},
					is_paid_fully:false,
				};
				if(results.getPnl.type=='single_pnl_head')
					filter.category=results.getPnl.details.pnl_head_category;


				Invoice.find(filter).sort('date').exec(callback);
			}],
			getCategorySpendingPerMonth:['getAccounts',function(results,callback){

				var escape=[req.query.date_from,req.query.date_to];
				var query = 'select count(*),sum(amount_inr),EXTRACT(YEAR FROM "occuredAt") as "year",EXTRACT(MONTH FROM "occuredAt") as "month",category from transaction_category';
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
			locals.invoices=results.getInvoices;
			res.view('view_pnl',locals);
		});
	},
	deletePnL:function(req,res){
		var locals={}
		res.view('delete_pnl',locals);
	},
	listInvoices:function(req,res){
		var locals={};
		var filters = {
			org:req.org.id
		}
		//filter for category
		if(req.query.category)
			filters.category = req.query.category;
		if(req.query.type)
			filters.type = req.query.type;
		
		// filter based in id
		if(req.query.ids){
			filters.id = {in: _.map(req.query.ids.split(','), function (each) {
				if(parseInt(each))
					return parseInt(each);
			})}
		}

		Invoice.find(filters).populate('category').sort('date DESC').exec(function(err,invoices){
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
	createOrg: async function (req, res) {
		var locals = {
			message:''
		};
		var domain = sails.config.mailgun.domain;
		if(req.body){
			var org= req.body;
			org.owner=req.user.id;
			org.email = req.body.email? req.body.email +'@'+domain: req.body.email;

			locals.org = org;

			try{
				var o = await Org.create(org)
				.intercept('E_UNIQUE', ()=>{ return new Error('There is already an Org using that email address!') });
				if(org.email)
					await MailgunService.createSmtpCredential({email:org.email});
				return res.redirect('/org/'+o.id+'/dashboard');
			}catch(err){
				locals.message = err.message;
				return res.view('create_org', locals);
			}
		}else{
			locals.org={};
			return res.view('create_org', locals);
		}
	},
	editOrg: async function (req, res) {
		var locals = {
			message:''
		};
		var org = await Org.findOne(req.org.id);
		locals.org = org;
		if(!org)
			res.view('404');

		if(req.body){
			var req_email = req.body.email ? req.body.email + '@' + sails.config.mailgun.domain: null;
			//Email once created, cannot be changed
			if(req_email && org.email && req_email != org.email){
				locals.message = 'Email once created, cannot be changed';
				return res.view('create_org', locals);
			}
			try{
				var updated = await Org.update(org.id,{name: req.body.name, description: req.body.description, type: req.body.type, email:req_email})
				.intercept('E_UNIQUE', ()=>{ return new Error('There is already an Org using that email address!') });

				locals.org = updated[0];
				//udate in mailgun if a new email id is added
				if(req_email)
					await MailgunService.createSmtpCredential({email:req_email});
			}catch(err){
				locals.message = err.message;
			}
		}
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
			locals.owner = _.remove(members, function(m){return req.org.owner == m.user.id})[0];	
			locals.members = members;
			res.view('list_members', locals);
		});
	},
	viewMember: function (req, res) {
		var locals = {};
		res.view('view_member', locals);
	},
	createMember: async function (req, res) {
		var locals = {
			status: '',
			message: '',
			email: '',
			type: ''
		};
		if(req.body){
			var user = await User.findOne({email: req.body.email});
			if(!user){
				locals.status = 'error';
				locals.message = "user doesn't exist with the email id"
				return res.view('create_member', locals);
			}
			var create= {
				type: req.body.type,
				user: user.id,
				org: req.params.o_id
			}
			var member = await Member.findOne({
				user: user.id,
				org: req.params.o_id});

			if(member){
				locals.status = 'error';
				locals.message = "member alread exists"
				return res.view('create_member', locals);
			}
				
			Member.create(create).exec(function(err){
				if(err)
					{
						locals.status = 'error';
						locals.message = err.message;
						return res.view('create_member', locals);
					}
				return res.redirect('/org/'+req.params.o_id+'/members');
			})
		}else{
			return res.view('create_member', locals);
		}
	},
	editMember: function (req, res) {
		var locals = {};
		res.view('create_member', locals);
	},
	deleteMember: async function (req, res) {
		var locals = {};
		var member = await Member.findOne(req.params.id);
		if(!member)
			return res.status(404).json({error: 'member not found'});
		if(req.org.owner == member.user)
			return res.status(400).json({error: "can't revoke the membership of owner"})
		await Member.destroy(req.params.id);
		return res.json({status:'success'});
	},
	listSettings: function(req, res){
		var locals = {};
		res.view('list_settings', locals);
	},

	listNotifications: async function(req, res){
		var locals={
			title:'Notifications',
			description:'Notification',
			layout:'layout',
			notifications:{}		
		}

		var last_seen_noti_time;
		if(req.user.details.notifications)
			last_seen_noti_time=req.user.details.notifications.last_seen_noti_time;
		else{
			req.user.details.notifications={};
			last_seen_noti_time='2017-01-01T00:00:00.000Z';	
		}

		locals.notifications.unseen = await Notification.find({user:req.user.id,createdAt:{'>':last_seen_noti_time}}).sort('createdAt DESC').limit(100);
		locals.notifications.seen = await Notification.find({user:req.user.id,createdAt:{'<':last_seen_noti_time}}).sort('createdAt DESC').limit(100);

		// new seen count will be sum of what is shown on the screen
		req.user.details.notifications.seen_count=locals.notifications.unseen.length+locals.notifications.seen.length;
		// new unseen count =0
		req.user.details.notifications.unseen_count=0;
		req.user.details.notifications.last_seen_noti_time=new Date().toISOString();
		// updating user details here
		await User.update({id:req.user.id},{details:req.user.details});

		// updating time ago for seen notifications
		locals.notifications.seen.forEach(function(n){
			n.createdAtAgo=GeneralService.timeAgo(n.createdAt);
		});
		// updating time ago for unseen notifications
		locals.notifications.unseen.forEach(function(n){
			n.createdAtAgo=GeneralService.timeAgo(n.createdAt);
		});

		return res.view('list_notifications', locals);
	},
	listLoans:function(req,res){
		var locals={};
		var filters = {
			org:req.org.id
		}
		//filter for type
		if(req.query.type)
			filters.type = req.query.type;
		
		// filter based in id
		if(req.query.ids){
			filters.id = {in: _.map(req.query.ids.split(','), function (each) {
				if(parseInt(each))
					return parseInt(each);
			})}
		}

		Loan.find(filters).sort('date DESC').exec(function(err,loans){
			if(err)
				throw err;
			locals.loans=loans;
			res.view('list_loans',locals);
		})
	},
	viewLoan:function(req,res){
		var locals={};
		res.view('view_loan',locals);
	},
	createLoan:function(req,res){
		if (req.body) { // post request
			console.log(req.body);
			const fx = require('money');
			fx.base = 'INR';
			fx.rates = sails.config.fx_rates;
			var loan = {
				original_currency: req.body.original_currency,
				date: new Date(req.body.date + ' ' + req.body.time + req.body.tz),
				createdBy: 'user',
				description: req.body.description,
				third_party: req.body.third_party,
				type:req.body.type,
				org:req.org.id,
			}
			if (req.body.type == 'lending') {
				loan.original_amount = -(req.body.original_amount);
				loan.amount_inr = -(fx.convert(req.body.original_amount, { from: loan.original_currency, to: "INR" }));
				loan.balance_due_inr = -(fx.convert(req.body.balance_due, { from: loan.original_currency, to: "INR" }));
			} else if (req.body.type == 'borrowing') {
				loan.original_amount = (req.body.original_amount);
				loan.amount_inr = (fx.convert(req.body.original_amount, { from: loan.original_currency, to: "INR" }));
				loan.balance_due_inr = (fx.convert(req.body.balance_due, { from: loan.original_currency, to: "INR" }));
			}
			// console.log('before transaction find or create');
			console.log(loan);
			Loan.create(loan).exec(function (err) {
				if (err)
					throw err;
				else {
					res.redirect('/org/' + req.org.id +'/loans');
				}	
			});
		} else { // view the form
			var locals = {
				loan: {
					date: '',
				},
			};
			res.view('create_loan', locals);
		}
	},
	editLoan:function(req,res){
		if (req.body) { // post request
			console.log(req.body);
			const fx = require('money');
			fx.base = 'INR';
			fx.rates = sails.config.fx_rates;
			var loan = {
				original_currency: req.body.original_currency,
				date: new Date(req.body.date + ' ' + req.body.time + req.body.tz),
				createdBy: 'user',
				description: req.body.description,
				third_party: req.body.third_party,
				type: req.body.type,
				org: req.org.id,
			}
				loan.original_amount = (req.body.original_amount);
				loan.amount_inr = (fx.convert(req.body.original_amount, { from: loan.original_currency, to: "INR" }));
				loan.balance_due_inr = (fx.convert(req.body.balance_due, { from: loan.original_currency, to: "INR" }));
			console.log(loan);
			Loan.update({id:req.params.i_id},loan).exec(function (err, loan) {
				if (err)
					throw err;
				else {
					res.redirect('/org/' + req.org.id + '/loans');
				}
			});
		} else { // view the form
			Loan.findOne({id:req.params.i_id}).exec(function(err,loan){
				loan.sub_total = (fx.convert(loan.sub_total_inr, { to: loan.original_currency, from: "INR" }));
				loan.gst_total = (fx.convert(loan.gst_total_inr, { to: loan.original_currency, from: "INR" }));
				loan.balance_due = (fx.convert(loan.balance_due_inr, { to: loan.original_currency, from: "INR" }));
				if(err)
					throw err;
				var locals = {
					loan: loan,
				};
				res.view('create_loan', locals);
			})
			
		}
	},
	listAssets:function(req,res){
		var locals={};
		var filters = {
			org:req.org.id
		}
		//filter for type
		if(req.query.type)
			filters.type = req.query.type;
		
		// filter based in id
		if(req.query.ids){
			filters.id = {in: _.map(req.query.ids.split(','), function (each) {
				if(parseInt(each))
					return parseInt(each);
			})}
		}

		Asset.find(filters).sort('date DESC').exec(function(err,assets){
			if(err)
				throw err;
			locals.assets=assets;
			res.view('list_assets',locals);
		})
	},
	viewAsset:function(req,res){
		var locals={};
		res.view('view_loan',locals);
	},
	createAsset:function(req,res){
		if (req.body) { // post request
			console.log(req.body);
			const fx = require('money');
			fx.base = 'INR';
			fx.rates = sails.config.fx_rates;
			var asset = {
				original_currency: req.body.original_currency,
				date: new Date(req.body.date + ' ' + req.body.time + req.body.tz),
				createdBy: 'user',
				description: req.body.description,
				name: req.body.name,
				type:req.body.type,
				org:req.org.id,
				unit_original_amount :(req.body.unit_original_amount),
				unit_amount_inr : (fx.convert(req.body.unit_original_amount, { from: req.body.original_currency, to: "INR" })),
				units:req.body.units,
			}
			// console.log('before transaction find or create');
			console.log(asset);
			Asset.create(asset).exec(function (err) {
				if (err)
					throw err;
				else {
					res.redirect('/org/' + req.org.id +'/assets');
				}	
			});
		} else { // view the form
			var locals = {
				asset: {
					date: '',
				},
			};
			res.view('create_asset', locals);
		}
	},
	editAsset:function(req,res){
		if (req.body) { // post request
			console.log(req.body);
			const fx = require('money');
			fx.base = 'INR';
			fx.rates = sails.config.fx_rates;
			var asset = {
				original_currency: req.body.original_currency,
				date: new Date(req.body.date + ' ' + req.body.time + req.body.tz),
				createdBy: 'user',
				description: req.body.description,
				name: req.body.name,
				type:req.body.type,
				org:req.org.id,
				unit_original_amount :(req.body.unit_original_amount),
				unit_amount_inr : (fx.convert(req.body.unit_original_amount, { from: req.body.original_currency, to: "INR" })),
				units:req.body.units,
			}
			// console.log('before transaction find or create');
			console.log(asset);
			Asset.update({id:req.params.i_id},asset).exec(function (err, asset) {
				if (err)
					throw err;
				else {
					res.redirect('/org/' + req.org.id + '/assets');
				}
			});
		} else { // view the form
			Asset.findOne({id:req.params.i_id}).exec(function(err,asset){
				asset.sub_total = (fx.convert(asset.sub_total_inr, { to: asset.original_currency, from: "INR" }));
				asset.gst_total = (fx.convert(asset.gst_total_inr, { to: asset.original_currency, from: "INR" }));
				asset.balance_due = (fx.convert(asset.balance_due_inr, { to: asset.original_currency, from: "INR" }));
				if(err)
					throw err;
				var locals = {
					asset: asset,
				};
				res.view('create_asset', locals);
			})
			
		}
	},
	createDocument: async function(req, res){
        var uploaded = await sails.uploadOne(req.file('attachment'));
		var document = await Document.create({ filename: uploaded.filename, 
			fd: uploaded.fd, mime: uploaded.type, 
			org: req.org.id, transaction_category: _.get(req, 'body.tc', null), description: _.get(req, 'body.description', null) }).fetch();
		if(req.query.redirect == 'true')
			return res.redirect(req.headers.referer);
       	res.json(document);
	},
	deleteDocument: async function(req, res){
	},
	listDocuments: async function(req, res){
		var archiver = require('archiver');
		var archive = archiver('zip');

		//filter object, defaults to org id.
		var filter = {
			org: req.org.id
		}
		
		if(req.query.ids){
			var ids = req.query.ids.split(',')
			filter.id = _.filter(ids, function(id){
				if(_.isNumber(parseInt(id)))
					return id;
			});
		}
		// get filtered documents
		var documents = await Document.find(filter);

		if(req.query.download == 'true'){
			//set the filename
			res.attachment(moment().format('LLL') + ' cashflowy documents.zip');
			var s3 = new AWS.S3({
				accessKeyId: sails.config.aws.key,
				secretAccessKey: sails.config.aws.secret,
				region: sails.config.aws.region
			});
			s3Zip
			.archive({ s3:s3, bucket: sails.config.aws.bucket}, '',
				_.map(documents, function(d){return d.fd;}))
			.pipe(res);
		}else{
			res.json(documents);
		}	
	},
	viewDocument: async function(req, res){
		var file = await Document.findOne({ id: req.params.id, org: req.org.id });
		if (!file) res.status(404).view('404');
		if(req.query.download == 'true'){
			res.attachment(file.fileName);
			var downloading = await sails.startDownload(file.fd);
			return downloading.pipe(res);
		}else{
			res.json(file);
		}
   		
	},
	bulkOps:function(req,res){
		var locals={}
		res.view('bulk_ops',locals);
	},
	bulkOpsEditCategory:function(req,res){
		var locals={};
		if(!req.body){
			async.auto({
				getCategories:function(callback){
					Category.find({org:req.org.id}).sort('name ASC').exec(callback);
				},
			},function(err,results){
				locals.categories=GeneralService.orderCategories(results.getCategories);
				res.view('bulk_ops_edit_category',locals);
			})
		}else{
			var tli_ids=req.body.t_ids.split(',');
			var category = req.body.category;
			// console.log(t_ids);
			// console.log(category);
			async.auto({
				getTlis: function(cb){
					Transaction_line_item.find(tli_ids).populate('account').exec(cb)
				},
				updateTlis: ['getTlis', function(results, cb){
					// to make sure that only the tlis in the org are updated. 
					// This is so that people dont mess around with the url.
					var relevant_tlis=[];
					results.getTlis.forEach(function(tli){
						if(_.get(tli, 'account.org') == req.org.id)
							relevant_tlis.push(tli.id);
					});
					console.log(relevant_tlis);
					Transaction_line_item.update({id: relevant_tlis}, {category:category}).exec(cb);
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
				var filter= JSON.parse(req.query.filter);
				res.redirect('/org/' + req.org.id +'/transactions?'+require('query-string').stringify(filter));
			})
			// res.send('Bulk operation successful, return to list_trasactions');
		}
	},
	listStatementsUploadStatus:function(req,res){
		console.log('req.query:');
		console.log(req.query);
		console.log(req.org)
		if(req.query&&req.query.statements){
			var statement_ids=req.query.statements.split(',')
			Statement.find({id:{in:statement_ids},org:req.org.id}).exec(function(err,statements){
				var locals={statements:statements};
				res.view('list_statement_statuses',locals)
			})
		}
	}
}