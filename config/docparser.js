module.exports.docparser={
	webhook_secret: process.env.DOCPARSER_WEBHOOK_SECRET,
	api_key: process.env.DOCPARSER_API_KEY,
	// filters: {
	//     hdfc_credit_card:'bzqxicqhpsrk',
	//     icici_bank:'sebtifdmvape',
	//     hdfc_bank:'jrvqwmfuhapd',
	//     sbi_bank:'mzbvtiryowtr',
	//     yes_bank_credit_card:'kelnksvuxwcv',
	//     hsbc_credit_card:'qyflunkxpizn',
	// },
	filters:[
		{
			docparser_id:'bzqxicqhpsrk',
			type:'hdfc_credit_card',
			name:'HDFC Credit Card',
			validateParsedDocument:function(parsed_data){
				return true;
			},
			// before it is saved in the database
			modifyParsedData:function(parsed_data){
				return parsed_data;
			}
		},
		{
			docparser_id:'sebtifdmvape',
			type:'icici_bank',
			name:'ICICI Bank',
		},
		{
			docparser_id:'jrvqwmfuhapd',
			type:'hdfc_bank',
			name:'HDFC Bank',
		},
		{
			docparser_id:'mzbvtiryowtr',
			type:'sbi_bank',
			name:'SBI Bank',
		},
		{
			docparser_id:'kelnksvuxwcv',
			type:'yes_bank_credit_card',
			name:'YES Credit card'
		},
		{
			docparser_id:'qyflunkxpizn',
			type:'hsbc_credit_card',
			name:'HSBC Credit card',
			validateParsedDocument:function(parsed_data){
				return true;
			},
			// before it is saved in the database
			modifyParsedData:function(parsed_data){
				parsed_data.transactions.forEach(function(t){
					var year=parsed_data.transaction_from_date.substring(0,4);
					if(t.date.substring(2,5)=='JAN')
						year=parsed_data.transaction_to_date.substring(0,4);
					t.date+=year;
					t.date=new Date(t.date).toISOString().substring(0,10);
				})
				return parsed_data;
			}
		},

	]
}