module.exports={
	gmail_filter:'from:(CitiAlert.India@citicorp.com) subject:("CitiAlert - UPI Fund Transfer Acknowledgement") ',
	active:true,
	required_fields:['account_last_4_digits','currency','amount','whom_you_paid','available_credit_balance','date','time','upi_ref_no'],
	body_parsers:[
		{
			version:'v1',
			description:'as of nov 2019',
			fields:[
				
				{
					name:'currency',
					type:'string',
					filters:[
						{
							type:'is',
							value:'INR'
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
							q:'Your Citibank A/c has been debited with INR '
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'has been credited'
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
							q:' on '
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
							q:'Your Citibank A/c has been debited with'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' has been credited.'
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
							q:'and account '
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
							q:'Your Citibank A/c has been debited with'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' has been credited.'
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
							q:'Your Citibank A/c has been debited with'
						},
						{
							type:'find_end_position',
							criteria:'text_match_before',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' has been credited.'
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
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:' at '
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
					]
				},
				{
					name:'upi_ref_no',
					type:'string',
					filters:[
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'Your Citibank A/c has been debited with'
						},
						{
							type:'find_start_position',
							criteria:'text_match_after',
							options:{
								case_sensitive:false,
								beginning_of_line:true
							},
							q:'UPI Ref no. '
						},
						{
							type:'trim',
						},
						
						{
							type:'substring',
							options:{
								start:0,
								end:12,
							}
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