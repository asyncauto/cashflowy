var moment = require('moment-timezone');

module.exports.docparser={
	webhook_secret: process.env.DOCPARSER_WEBHOOK_SECRET,
	api_key: process.env.DOCPARSER_API_KEY,
	beforeModifyParsedData: function(extracted_data){
		var data = _.cloneDeep(extracted_data);
		Object.keys(data).forEach(function(key){
			if(data[key] && data[key].formatted)
				data[key]=data[key].formatted;
		})

		data.acc_numbers = [];
		if(extracted_data.account_id){
			data.acc_numbers.push(extracted_data.account_id);
			data.acc_number = extracted_data.account_id.substr(-4);
		}
		return data;
	},
	afterModifyParsedData: function(extracted_data){
		var data = _.cloneDeep(extracted_data);
		return data;
	},
	filters:[
		{
			docparser_id:'bzqxicqhpsrk',
			type:'hdfc_credit_card',
			name:'HDFC Credit Card',
			validateParsedStatement:function(parsed_data){
				return true;
			},
			// before it is saved in the database
			modifyParsedData:function(extracted_data){
				var data = _.cloneDeep(extracted_data);

				data.transactions.forEach(function(t){
					t.date = moment(t.date, 'MM/DD/YYYY').tz('Asia/Kolkata').toISOString().substring(0,10)
					t.amount = t.amount.replace(/,/g,'')
				});

				if(data.transactions && data.transactions.length){
					data.transactions_from_date = data.transactions[0].date;
					data.transactions_to_date = data.transactions[data.transactions.length -1].date;
				}
				return data;
			}
		},
		{
			docparser_id:'sebtifdmvape',
			type:'icici_bank',
			name:'ICICI Bank',
			modifyParsedData:  function(extracted_data){
				var data = _.cloneDeep(extracted_data);
				data.acc_numbers = _.map(data.accounts, 'acc_no');
				data.acc_number = _.find(extracted_data.accounts,{acc_type:'Savings'}).acc_no;
				data.transactions.forEach(function(t){
					t.date = moment(t.date, 'DD-MM-YYYY').tz('Asia/Kolkata').toISOString().substring(0,10);
					t.credit = t.credit.replace(/,/g,'');
					t.debit = t.debit.replace(/,/g,'');
					if(t.balance)
						t.balance = t.balance.replace(/,/g,'');
				});
				 
				return data;
			}
		},
		{
			docparser_id:'jrvqwmfuhapd',
			type:'hdfc_bank',
			name:'HDFC Bank',
			modifyParsedData: function(extracted_data){
				var data = _.cloneDeep(extracted_data);
				data.transactions.forEach(function(t){
					t.date = moment(t.date, 'DD/MM/YYYY').tz('Asia/Kolkata').toISOString().substring(0,10);
					if(t.balance)
						t.balance = t.balance.replace(/,/g,'');
					t.credit = t.credit.replace(/,/g,'');
					t.debit = t.debit.replace(/,/g,'');
				});
				return data;
			}
		},
		{
			docparser_id:'mzbvtiryowtr',
			type:'sbi_bank',
			name:'SBI Bank',
			modifyParsedData: function(extracted_data){
				var data = _.cloneDeep(extracted_data);
				data.transactions.forEach(function(t){
					t.date = new Date(t.txn_date+' 12:00 +5:30').toISOString().substring(0,10);
					t.credit = t.credit.replace(/,/g,'');
					t.debit = t.debit.replace(/,/g,'');
					if(t.balance)
						t.balance = t.balance.replace(/,/g,'');
				});
				return data;
			}
		},
		{
			docparser_id:'kelnksvuxwcv',
			type:'yes_bank_credit_card',
			name:'YES Credit card',
			modifyParsedData: function(extracted_data){
				var data = _.cloneDeep(extracted_data);
				data.transactions.forEach(function(t){
					t.date = moment(t.date, 'MM/DD/YYYY').tz('Asia/Kolkata').toISOString().substring(0,10);
					t.amount = t.amount.replace(/,/g,'');
				});
				return data;
			}
		},
		{
			docparser_id:'qyflunkxpizn',
			type:'hsbc_credit_card',
			name:'HSBC Credit card',
			validateParsedStatement:function(parsed_data){
				return true;
			},
			// before it is saved in the database
			modifyParsedData:function(extracted_data){
				var data = _.clone(extracted_data)
				data.transactions.forEach(function(t){
					var year=data.transactions_from_date.substring(0,4);
					if(t.date.substring(2,5)=='JAN')
						year=data.transactions_to_date.substring(0,4);
					t.date+=year;
					t.date=new Date(t.date).toISOString().substring(0,10);
					t.amount = t.amount.replace(/,/g,'');
				})
				return data;
			}
		},
		{
			docparser_id:'cyfaymeukchi',
			type:'icici_bank_credit_card',
			name:'ICICI Credit card',
			modifyParsedData:function(extracted_data){
				var data = _.clone(extracted_data)
				if(data.transactions && data.transactions.length){
					if(!data.transactions_from_date) // if transaction_from_date does not exist
						data.transactions_from_date = data.transactions[0].date;
					if(!data.transactions_to_date) // if transaction_end_date does not exist
						data.transactions_to_date = data.transactions[data.transactions.length -1].date;
				}
				return data;
			}
		},
		{
			docparser_id:'fxbmpihdoiae',
			type:'citi_bank_platinum_credit_card',
			name:'CITI Bank Platinum Credit card',
			modifyParsedData:function(extracted_data){
				var data = _.clone(extracted_data)
				data.transactions.forEach(function(t){
					var year=data.transactions_from_date.substring(0,4);
					if(t.date.substring(3)=='01')
						year=data.transactions_to_date.substring(0,4);
					t.date+='/'+year;
					t.date=moment(t.date, 'DD/MM/YYYY').tz('Asia/Kolkata').toISOString().substring(0,10)
					t.amount = t.amount.replace(/,/g,'');
					delete t.key_1;
				})
				if(data.transactions && data.transactions.length){
					if(!data.transactions_from_date) // if transaction_from_date does not exist
						data.transactions_from_date = data.transactions[0].date;
					if(!data.transactions_to_date) // if transaction_end_date does not exist
						data.transactions_to_date = data.transactions[data.transactions.length -1].date;
				}
				return data;
			}
		},

	]
}