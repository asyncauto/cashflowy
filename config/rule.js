module.exports.rule={
	triggers:[
		{
			slug:'tli_after_create',
			title:'After creating a tli',
			description:'This event is fired after a tli is created',
			model:'tli'
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
			description:'change the tli type to transfer',
			allowed_triggers:['tli_after_create'],
		},
		{
			slug:'apply_tags',
			title:'Apply Tags',
			description:'apply tags to the tli',
			allowed_triggers:['tli_after_create'],
		},
		{
			slug:'set_category',
			title:'Set category',
			description:'Set a category for this tli',
			allowed_triggers:['tli_after_create'],
		},
		{
			slug:'modify_pe_data',
			title:'Modify parsed data from email',
			description:'Modify the data parsed from email. Most useful for appending information that is not availabe in email',
			allowed_triggers:['parsed_email_before_create'],
		}
	]
}