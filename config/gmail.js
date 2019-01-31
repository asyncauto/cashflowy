module.exports.gmail = {  
	"installed":{  
		"client_id":process.env.GOOGLE_CLIENT_ID,
		"project_id":process.env.GOOGLE_PROJECT_ID,
		"auth_uri":"https://accounts.google.com/o/oauth2/auth",
		"token_uri":"https://www.googleapis.com/oauth2/v3/token",
		"auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs",
		"client_secret":process.env.GOOGLE_CLIENT_SECRET,
		"redirect_uris":[  
			"urn:ietf:wg:oauth:2.0:oob",
			process.env.GOOGE_REDIRECT_URL
		]
	}
}