module.exports={
	convertSliToTransaction:[
		{
			description:'Line item is a balance statement',
			input:{  
				document:2,
				pos:0,
				extracted_data:{  
					date:'01-11-2018',
					type:'',
					paid_whom:'B/F',
					credit:'',
					debit:'',
					balance:'2,54,113.64',
					acc_no:'0651'
				},
				transaction:null,
				user:1,
				id:26,
				createdAt:'2018-12-21T10:27:07.000Z',
				updatedAt:'2018-12-21T10:27:07.000Z',
				type:'ICICIBankStatement',
				body_parser_used:'sebtifdmvape',
				data:{  
					date:'01-11-2018',
					type:'',
					paid_whom:'B/F',
					credit:'',
					debit:'',
					balance:'2,54,113.64',
					acc_no:'0651',
					currency:'INR'
				}
			},
			output:{
				"account": "0651",
				"createdBy": "parsed_document",
				"occuredAt": new Date("2018-11-01T06:30:00.000Z"),
				"original_currency": "INR",
				"third_party": "B/F",
				"type": "income_expense",
			},
		},
		{
			description:'UPI payment',
			input:{
				"document": 2,
				"pos": 24,
				"extracted_data": {
					"date": "30-11-2018",
					"type": "",
					"paid_whom": "UPI/833443528673/NA/Nadeer Muhammed/Paytm Payments",
					"credit": "",
					"debit": "100.00",
					"balance": "2,65,715.42",
					"acc_no": "0651"
				},
				"transaction": null,
				"user": 1,
				"id": 54,
				"createdAt": "2018-12-21T10:39:27.000Z",
				"updatedAt": "2018-12-21T10:39:27.000Z",
				type:'ICICIBankStatement',
				body_parser_used:'sebtifdmvape',
				data:{  
					"date": "30-11-2018",
					"type": "",
					"paid_whom": "UPI/833443528673/NA/Nadeer Muhammed/Paytm Payments",
					"credit": "",
					"debit": "100.00",
					"balance": "2,65,715.42",
					"acc_no": "0651",
					"currency":'INR'
				}
			},
			output:{  
				"account":"0651",
				"amount_inr":-100,
				"createdBy":"parsed_document",
				"occuredAt":new Date("2018-11-30T06:30:00.000Z"),
				"original_amount":-100,
				"original_currency":"INR",
				"third_party":"UPI/833443528673/NA/Nadeer Muhammed/Paytm Payments",
				"type":"income_expense"
			},
		},
		{
			description:'NEFT income salary',
			input:{
				"document": 2,
				"pos": 23,
				"extracted_data": {
					"date": "30-11-2018",
					"type": "",
					"paid_whom": "NEFT-CITIN18956860937-ATHER ENERGY PVT LTD-PYM ATH ER SALARY NOV 18-0712074019-CITI0000004",
					"credit": "2,52,000.00",
					"debit": "",
					"balance": "2,65,815.42",
					"acc_no": "0651"
				},
				"transaction": null,
				"user": 1,
				"id": 53,
				"createdAt": "2018-12-21T10:39:27.000Z",
				"updatedAt": "2018-12-21T10:39:27.000Z",
				type:'ICICIBankStatement',
				body_parser_used:'sebtifdmvape',
				data:{  
					"date": "30-11-2018",
					"type": "",
					"paid_whom": "NEFT-CITIN18956860937-ATHER ENERGY PVT LTD-PYM ATH ER SALARY NOV 18-0712074019-CITI0000004",
					"credit": "2,52,000.00",
					"debit": "",
					"balance": "2,65,815.42",
					"acc_no": "0651",
					"currency":'INR'
				}
			},
			output:{  
				"account":"0651",
				"amount_inr":252000,
				"createdBy":"parsed_document",
				"occuredAt":new Date("2018-11-30T06:30:00.000Z"),
				"original_amount":252000,
				"original_currency":"INR",
				"third_party":"NEFT-CITIN18956860937-ATHER ENERGY PVT LTD-PYM ATH ER SALARY NOV 18-0712074019-CITI0000004",
				"type":"income_expense"
			},
		},
		{
			description:'UPI incoming',
			input:{
				"document": 2,
				"pos": 4,
				"extracted_data": {
					"date": "05-11-2018",
					"type": "",
					"paid_whom": "UPI/830819336337/NO REMARKS/7022625221@upi/Citiban k",
					"credit": "2,611.00",
					"debit": "",
					"balance": "2,15,361.74",
					"acc_no": "0651"
				},
				"transaction": null,
				"user": 1,
				"id": 55,
				"createdAt": "2018-12-29T04:57:37.000Z",
				"updatedAt": "2018-12-29T04:57:37.000Z",
				type:'ICICIBankStatement',
				body_parser_used:'sebtifdmvape',
				data:{  
					"date": "05-11-2018",
					"type": "",
					"paid_whom": "UPI/830819336337/NO REMARKS/7022625221@upi/Citiban k",
					"credit": "2,611.00",
					"debit": "",
					"balance": "2,15,361.74",
					"acc_no": "0651",
					"currency":'INR'
				}
			},
			output:{  
				"account":"0651",
				"amount_inr":2611,
				"createdBy":"parsed_document",
				"occuredAt":new Date("2018-11-05T06:30:00.000Z"),
				"original_amount":2611,
				"original_currency":"INR",
				"third_party":"UPI/830819336337/NO REMARKS/7022625221@upi/Citiban k",
				"type":"income_expense"
			},
		},
		{
			description:'Netbanking outgoing',
			input:{
				"document": 2,
				"pos": 7,
				"extracted_data": {
					"date": "05-11-2018",
					"type": "NET BANKING",
					"paid_whom": "BIL/001570697506/SIPG/AUYTV7CZRRYE0A",
					"credit": "",
					"debit": "30,000.00",
					"balance": "1,19,361.74",
					"acc_no": "0651"
				},
				"transaction": null,
				"user": 1,
				"id": 56,
				"createdAt": "2018-12-29T04:57:37.000Z",
				"updatedAt": "2018-12-29T04:57:37.000Z",
				type:'ICICIBankStatement',
				body_parser_used:'sebtifdmvape',
				data:{  
					"date": "05-11-2018",
					"type": "NET BANKING",
					"paid_whom": "BIL/001570697506/SIPG/AUYTV7CZRRYE0A",
					"credit": "",
					"debit": "30,000.00",
					"balance": "1,19,361.74",
					"acc_no": "0651",
					"currency":'INR'
				}
			},
			output:{  
				"account":"0651",
				"amount_inr":-30000,
				"createdBy":"parsed_document",
				"occuredAt":new Date("2018-11-05T06:30:00.000Z"),
				"original_amount":-30000,
				"original_currency":"INR",
				"third_party":"BIL/001570697506/SIPG/AUYTV7CZRRYE0A",
				"type":"income_expense"
			},
		},
		{
			description:'Mobile banking IMPS outgoing',
			input:{
				"document": 2,
				"pos": 15,
				"extracted_data": {
					"date": "21-11-2018",
					"type": "MOBILE BANKING",
					"paid_whom": "MMT/IMPS/832514541249/living expense/SOUMYA THO/HD FC0001759/chgRs5.00GSTRs0.90",
					"credit": "",
					"debit": "15,005.90",
					"balance": "2,276.46",
					"acc_no": "0651"
				},
				"transaction": null,
				"user": 1,
				"id": 57,
				"createdAt": "2018-12-29T04:57:37.000Z",
				"updatedAt": "2018-12-29T04:57:37.000Z",
				type:'ICICIBankStatement',
				body_parser_used:'sebtifdmvape',
				data:{  
					"date": "21-11-2018",
					"type": "MOBILE BANKING",
					"paid_whom": "MMT/IMPS/832514541249/living expense/SOUMYA THO/HD FC0001759/chgRs5.00GSTRs0.90",
					"credit": "",
					"debit": "15,005.90",
					"balance": "2,276.46",
					"acc_no": "0651",
					"currency":'INR'
				}
			},
			output:{  
				"account":"0651",
				"amount_inr":-15005.9,
				"createdBy":"parsed_document",
				"occuredAt":new Date("2018-11-21T06:30:00.000Z"),
				"original_amount":-15005.9,
				"original_currency":"INR",
				"third_party":"MMT/IMPS/832514541249/living expense/SOUMYA THO/HD FC0001759/chgRs5.00GSTRs0.90",
				"type":"income_expense"
			},
		},
		{
			description:'NEFT incoming zerodha',
			input:{
				"document": 2,
				"pos": 16,
				"extracted_data": {
					"date": "22-11-2018",
					"type": "",
					"paid_whom": "NEFT-N326180684665465-ZERODHA  NSE CLIENT AC-21112 018 KEPA5334 17-05230340003662-HDFC0000240",
					"credit": "21,667.96",
					"debit": "",
					"balance": "23,944.42",
					"acc_no": "0651"
				},
				"transaction": null,
				"user": 1,
				"id": 58,
				"createdAt": "2018-12-29T04:57:37.000Z",
				"updatedAt": "2018-12-29T04:57:37.000Z",
				type:'ICICIBankStatement',
				body_parser_used:'sebtifdmvape',
				data:{  
					"date": "22-11-2018",
					"type": "",
					"paid_whom": "NEFT-N326180684665465-ZERODHA  NSE CLIENT AC-21112 018 KEPA5334 17-05230340003662-HDFC0000240",
					"credit": "21,667.96",
					"debit": "",
					"balance": "23,944.42",
					"acc_no": "0651",
					"currency":'INR'
				}
			},
			output:{  
				"account":"0651",
				"amount_inr":21667.96,
				"createdBy":"parsed_document",
				"occuredAt":new Date("2018-11-22T06:30:00.000Z"),
				"original_amount":21667.96,
				"original_currency":"INR",
				"third_party":"NEFT-N326180684665465-ZERODHA  NSE CLIENT AC-21112 018 KEPA5334 17-05230340003662-HDFC0000240",
				"type":"income_expense"
			},
		},
	]
}