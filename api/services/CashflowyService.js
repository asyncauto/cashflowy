var async=require('async');
const fx = require('money');
fx.base='INR';
fx.rates=sails.config.fx_rates;

var convertSliToTransaction = function(sli){
	var t={
		original_currency:sli.data.currency,
		createdBy:'parsed_document',
		type:'income_expense',
		account:sli.data.acc_no,
		third_party:sli.data.paid_whom,
	}

	if(sli.type=='ICICIBankStatement' && sli.body_parser_used=='sebtifdmvape'){
		sli.data.credit=sli.data.credit.replace(',','');
		sli.data.credit=sli.data.credit.replace(',','');
		sli.data.credit=sli.data.credit.replace(',','');
		sli.data.debit=sli.data.debit.replace(',','');
		sli.data.debit=sli.data.debit.replace(',','');
		sli.data.debit=sli.data.debit.replace(',','');
		if(!isNaN(parseFloat(sli.data.credit))) // is credit a number
			t.original_amount=parseFloat(sli.data.credit);
		else if(!isNaN(parseFloat(sli.data.debit)))
			t.original_amount=-parseFloat(sli.data.debit);
	}

	// t.amount_inr=t.original_amount;
	if(t.original_amount)
		t.amount_inr=fx.convert(t.original_amount, {from: sli.data.currency, to: "INR"});
	
	if(sli.data.date){
		var temp_date=sli.data.date.split('-').reverse().join('-');
		t.occuredAt = new Date(temp_date+' 12:00:00.000 +5:30'); 
	}
	return t;
}

var checkIfTransactionExists = function(t,sli){
	
}

module.exports={
	internal:{
		convertSliToTransaction:convertSliToTransaction,
	},
	afterCreate_SLI:function(sli,callback){
		// check if transaction exists, 
		// if not create a transaction and link it to the sli
		sli.type='ICICIBankStatement';
		sli.body_parser_used='sebtifdmvape';
		sli.data=_.cloneDeep(sli.extracted_data); // temp - should be removed
		sli.data.currency?sli.data.currency:'INR';
		if(!sli.data.currency)
			sli.data.currency='INR'
		console.log('\n\n\n ------------');
		var t = convertSliToTransaction(sli);
		console.log(t);

		async.auto({
			getAccount:function(callback){
				var filter = {
					like:{
						acc_number:'%'+t.account, // ends with the following number
					},
					user:sli.user
				}
				var account={ // incase the account does not exist, create account.
					acc_number:''+t.account,
					user:sli.user,
					type:'bank', // user might need to change this
					name:'Auto generated account'+t.account,
				} 
				Account.findOne(filter).exec(function(err,result){
					if(result)
						callback(err,result);
					else{
						Account.create(account).exec(function(err,result){
							callback(err,result);
						});
					}
				});
				
			},
			findSimilarTransactions:['getAccount',function(results,callback){
				t.account=results.getAccount.id;
				var find={
					account:t.account,
					original_amount:t.original_amount,
					original_currency:t.original_currency,
					occuredAt:t.occuredAt,
				};
				Transaction.find(find).exec(callback);
			}],
			createTransaction:['findSimilarTransactions',function(results,callback){
				sli.transaction=null;
				t.account=results.getAccount.id;
				if(t.original_amount){
					Transaction.create(t).exec(function(err,transaction){
						console.log(err);
						sli.transaction=transaction.id;
						callback(err,transaction);
					});
				}
			}],
			updateSli:['createTransaction',function(results,callback){
				Statement_line_item.update({id:sli.id},{transaction:sli.transaction}).exec(callback);
			}]
		},callback)



	},
	
	
}