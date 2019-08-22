/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

	/***************************************************************************
	 * Set the default database connection for models in the development       *
	 * environment (see config/connections.js and config/models.js )           *
	 ***************************************************************************/
	models: {
		datastore: 'default',
		migrate: 'safe'
	},

	datastores: {
		default: {
			adapter: 'sails-postgresql',
			host: process.env.DB_HOST,
			user: process.env.DB_USER, // optional
			password: process.env.DB_PASSWORD, // optional
			database: process.env.DB_DATABASE, //optional
		}
	},
	bull: {
		redis: {
			host: process.env.REDIS_HOST,
			port: 6379,
			db: 4,
			maxRetriesPerRequest: null,
			enableReadyCheck: false
		}
	},
	session: {
		adapter: 'connect-redis',
		host: process.env.REDIS_HOST,
		port: 6379,
		db: 5,
	},
	slack_webhook: process.env.SLACK_WEBHOOK,
	mailgun: {
		api_key: process.env.MAILGUN_APIKEY,
		domain: process.env.MAILGUN_DOMAIN,
		webhook_secret: process.env.MAILGUN_WEBHOOK_SECRET
	},
	background_secret: process.env.BACKGROUND_SECRET,

	password_reset_secret: process.env.PASSWORD_RESET_SECRET,

	app_url: process.env.APP_URL,

	aws: {
		key: process.env.AWS_ACCESS_KEY,
		secret: process.env.AWS_ACCESS_SECRET,
		region: process.env.AWS_REGION,
		bucket: process.env.AWS_BUCKET,
		category_model_id: process.env.AWS_CATEGORY_MODEL_ID,
		prediction_endpoint: process.env.AWS_PREDICTION_ENDPOINT,
		kms_key_id: process.env.AWS_KMS_KEY_ID
	},

	metabase: {
		site_url: process.env.METABASE_SITE_URL,
		secret_key: process.env.METABASE_SECRET_KEY
	},
	api_token_secret: process.env.API_TOKEN_SECRET,

	uploads: {
    adapter: require('skipper-s3'),
    key: process.env.AWS_ACCESS_KEY,
    secret: process.env.AWS_ACCESS_SECRET,
    bucket: process.env.AWS_BUCKET,
    region: process.env.AWS_REGION,
   }
};
