var async=require('async');

module.exports={
	evaluateCondition:function(condition,pe){
		var status=true;
		// console.log('************************');
		// console.log(condition);
		// console.log(pe);
		Object.keys(condition).forEach(function(c_key){
			// console.log(c_key);
			if(c_key=='type'){
				// console.log('checking type');
				// console.log(condition[c_key])
				if(pe.type!=condition[c_key])
					status=false;
			}else if(c_key=='body_parser_used'){
				if(pe.body_parser_used!=condition[c_key])
					status=false;
			}else if(c_key=='extracted_data.debit_card_last_4_digits'){
				// console.log('checking debit card last 4 digits');
				console.log(condition[c_key]);
				console.log(pe.extracted_data.debit_card_last_4_digits);
				if(pe.extracted_data.debit_card_last_4_digits!=condition[c_key])
					status=false;
			}
			// console.log("\n"+c_key);
			// console.log(status);
		})
		return status;
	}
}