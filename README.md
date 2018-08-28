# cashflowy

a [Sails](http://sailsjs.org) application

## Production ENV variables

The following variables are needed in production env
- SAILS_SESSION_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_PROJECT_ID
- GOOGLE_CLIENT_SECRET
- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_DATABASE


## We dont use double entry
This is intensional. Double entry was designed in an era where accounting was done on paper where manual error was common. Double entry makes accounting sound very complex(with all credit and debit nonsense). Cashflowy is designed with a regular person in mind. A regular person does not want to/have to know the principles of accounting practices. A regular person however benefits a ton from knowing how her money flows. 

If you made a financial transaction, the entry is made once. thats it! There is only one source of truth. It does not have to exist in two places ! We want to clearly stay away from accounting jargon. 