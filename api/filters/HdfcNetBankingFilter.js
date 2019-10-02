module.exports={
	gmail_filter:'from:(alerts@hdfcbank.net) "has been debited" -"upi"',
	active:true,
	required_fields:['account_last_4_digits','currency','amount','whom_you_paid','available_credit_balance','date','time','upi_ref_no'],
	body_parsers:[
		{
			version:'v1',
			description:'as of oct 2018',
			fields:[
				{
					name:'account_last_4_digits',
					type:'integer',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Thank you for using HDFC Bank NetBanking'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'As a thank you gesture from us'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' from A/c XXXX'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'to '
						},
						{
							type:'trim',
						},
					]
				},
				{
					name:'currency',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Thank you for using HDFC Bank NetBanking'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'As a thank you gesture from us'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'for payment of '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' from '
						},
						{
							type:'trim',
						},
						{
							type:'substring',
							options:{
								start:0,
								end:3,
							}
						},
						{
							type:'replace',
							options:{
								replace:'Rs.',
								with:'INR',
							}
						},
					]
				},
				{
					name:'amount',
					type:'float',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Thank you for using HDFC Bank NetBanking'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'As a thank you gesture from us'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'for payment of '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' from '
						},
						{
							type:'trim',
						},
						{
							type:'substring',
							options:{
								start:3,
							}
						},
						{
							type:'replace',
							options:{
								replace:',',
								with:'',
							}
						},
					]
				},
				{
					name:'third_party',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Thank you for using HDFC Bank NetBanking'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'As a thank you gesture from us'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' from A/c XXXX'
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'to '
						},
						{
							type:'trim',
						},
					]
				},
			]
		},
		{
			version:'vx',
			description:'starts with amount',
			fields:[
				{
					name:'account_last_4_digits',
					type:'integer',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Available balance is'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' from A/c XX'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'on account of'
						},
						{
							type:'trim',
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' at '
						},
						{
							type:'trim',
						},
					]
				},
				{
					name:'amount',
					type:'float',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Available balance is'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Amount of INR'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'has been debited'
						},
						{
							type:'trim',
						},
						{
							type:'replace',
							options:{
								replace:',',
								with:'',
							}
						},
					]
				},
				{
					name:'third_party',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'on account of' 
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Available balance is INR'
						},
						{
							type:'trim',
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'on '
						},
						{
							type:'trim',
						},
					]
				},
			]
		},
		{
			version:'cc_pay_v1',
			description:'as of oct 2018',
			fields:[
				{
					name:'account_last_4_digits',
					type:'integer',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'In case you need any further'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'from your account No. XXXX'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' on account of'
						},
						{
							type:'trim',
						},
					]
				},
				{
					name:'currency',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'In case you need any further'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' that an amount of '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' has been debited from'
						},
						{
							type:'trim',
						},
						{
							type:'substring',
							options:{
								start:0,
								end:3,
							}
						},
						{
							type:'replace',
							options:{
								replace:'Rs.',
								with:'INR',
							}
						},
					]
				},
				{
					name:'amount',
					type:'float',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'In case you need any further'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' that an amount of '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' has been debited from'
						},
						{
							type:'trim',
						},
						{
							type:'substring',
							options:{
								start:3,
							}
						},
						{
							type:'replace',
							options:{
								replace:',',
								with:'',
							}
						},
						{
							type:'trim',
						},
					]
				},
				{
					name:'third_party',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'In case you need any further'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' on account of '
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' done using HDFC Bank NetBanking'
						},
						{
							type:'trim',
						},
					]
				},
			]
		},
		{
			version:'cc_pay_v2',
			description:'as of july 2018',
			fields:[
				{
					name:'account_last_4_digits',
					type:'integer',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'In case you need any further'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'from your account number XXXX'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' on account of'
						},
						{
							type:'trim',
						},
					]
				},
				{
					name:'currency',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'In case you need any further'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' that an amount of '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' has been debited from'
						},
						{
							type:'trim',
						},
						{
							type:'substring',
							options:{
								start:0,
								end:3,
							}
						},
						{
							type:'replace',
							options:{
								replace:'Rs.',
								with:'INR',
							}
						},
					]
				},
				{
					name:'amount',
					type:'float',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'In case you need any further'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' that an amount of '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' has been debited from'
						},
						{
							type:'trim',
						},
						{
							type:'substring',
							options:{
								start:3,
							}
						},
						{
							type:'replace',
							options:{
								replace:',',
								with:'',
							}
						},
						{
							type:'trim',
						},
					]
				},
				{
					name:'third_party',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'In case you need any further'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' on account of '
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'done using HDFC Bank NetBanking'
						},
						{
							type:'trim',
						},
					]
				},
			]
		},
		{
			version:'online_pay_v1',
			description:'as of oct 2018',
			fields:[
				{
					name:'account_last_4_digits',
					type:'integer',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'For more details on the transaction'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'from your account No. XXXX'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' on account of'
						},
						{
							type:'trim',
						},
					]
				},
				{
					name:'currency',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'For more details on the transaction'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' that an amount of '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' has been debited from'
						},
						{
							type:'trim',
						},
						{
							type:'substring',
							options:{
								start:0,
								end:3,
							}
						},
						{
							type:'replace',
							options:{
								replace:'Rs.',
								with:'INR',
							}
						},
					]
				},
				{
					name:'amount',
					type:'float',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'For more details on the transaction'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' that an amount of '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' has been debited from'
						},
						{
							type:'trim',
						},
						{
							type:'substring',
							options:{
								start:3,
							}
						},
						{
							type:'replace',
							options:{
								replace:',',
								with:'',
							}
						},
						{
							type:'trim',
						},
					]
				},
				{
					name:'third_party',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer,'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'For more details on the transaction'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' on account of '
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' done using HDFC Bank NetBanking'
						},
						{
							type:'trim',
						},
					]
				},
			]
		},
		{
			version:'rtgs_v1',
			description:'as of oct 2018',
			fields:[
				
				{
					name:'currency',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'RTGS Transaction with reference'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'has been credited to the'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' for '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' '
						},
						{
							type:'trim',
						},
						
					]
				},
				{
					name:'amount',
					type:'float',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'RTGS Transaction with reference'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'has been credited to the'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' for '
						},
						{
							type:'replace',
							options:{
								replace:',',
								with:'',
							}
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' '
						},
						
						{
							type:'trim',
						},
					]
				},
				{
					name:'third_party',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'RTGS Transaction with reference number'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'With Regards'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'has been credited to the beneficiary'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' on '
						},
						{
							type:'trim',
						},
					]
				},
				{
					name:'date',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'RTGS Transaction with reference number'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'With Regards'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'has been credited to the beneficiary account number '
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' on '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' at '
						},
						{
							type:'trim',
						},
					]
				},
				{
					name:'time',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'RTGS Transaction with reference number'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'With Regards'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'has been credited to the beneficiary account number '
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' on '
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' at '
						},
						{
							type:'trim',
						},
					]
				},
			]
		},
		{
			version:'imps_v1',
			description:'as of oct 2019',
			fields:[
				{
					name:'account_last_4_digits',
					type:'integer',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'is debited for '
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Your A/c xxxxxxxxxx'
						},
						
						{
							type:'trim',
						},
					]
				},
				
				{
					name:'currency',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' is debited for '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Available balance is '
						},
						{
							type:'trim',
						},
						
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' is credited.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' on '
						},
						{
							type:'trim',
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' '
						},
					]
				},
				{
					name:'amount',
					type:'float',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' is debited for '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Available balance is '
						},
						{
							type:'trim',
						},
						
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' is credited.'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' on '
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' '
						},
						{
							type:'replace',
							options:{
								replace:',',
								with:'',
							}
						},
						{
							type:'trim',
						},
					]
				},
				{
					name:'third_party',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' is credited'
						},
						{
							type:'trim',
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' and '
						},
						
						{
							type:'trim',
						},
					]
				},
				{
					name:'date',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Dear Customer'
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'is debited for'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'is credited'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' and '
						},
						{
							type:'trim',
						},
						
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' on '
						},
						{
							type:'trim',
						},
					]
				},
				
			]
		},
	]
	
}