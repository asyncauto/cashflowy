
module.exports = function (callback) {

	/*
	When running on local machine, some configs are not necessary. Not having it setup 
	prevents sails from lifting. The follwing config are set to some dummy value so that
	sails can lift. These features, because they contain dummy value will obviously not work. 
	 */
	if(!sails.config.mailgun){ // on local machine
		sails.config.mailgun={
			api_key:'key-sdasfasfdasf',
			domain:'localhost'
		}
	}
	if(!sails.config.slack_webhook)
		sails.config.slack_webhook='https://slack.com/sadfasfasfsfd' // just so that it does not break

	callback(null);
}