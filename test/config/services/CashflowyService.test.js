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
			description:'NEFT income',
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
		}
	]
}