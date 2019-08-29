module.exports.rule={
	triggers:[
		{
			slug:'transaction_category_after_create',
			title:'After creating a transaction category',
			description:'This event is fired after a transactin_category is created',
			model:'transaction_category'
		},
		{
			slug:'parsed_email_before_create',
			title:'Before creating a parsed email',
			description:'This hook is when the data is extracted from an email and is just about to be stored in the database. Useful for modifying the data just before storing.',
		}
	],
	actions:[
		{
			slug:'mark_as_transfer',
			title:'Mark as transfer',
			description:'change the transaction_category type to transfer',
			allowed_triggers:['transaction_category_after_create'],
		},
		{
			slug:'apply_tags',
			title:'Apply Tags',
			description:'apply tags to the transaction_category',
			allowed_triggers:['transaction_category_after_create'],
		},
		{
			slug:'set_category',
			title:'Set category',
			description:'Set a category for this transaction_category',
			allowed_triggers:['transaction_category_after_create'],
		},
		{
			slug:'modify_pe_data',
			title:'Modify parsed data from email',
			description:'Modify the data parsed from email. Most useful for appending information that is not availabe in email',
			allowed_triggers:['parsed_email_before_create'],
		}
	]
}