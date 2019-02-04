# cashflowy

## About

Cashflowy is result of me trying to address a personal problem of mine. These are the problems I faced and is looking to address with Cashflowy:
1. Feeling stressed not knowning what happened to money that I make. Month after month, it just seems to disappear. Due to this, I am reacting to situations instead of being able to plan things.
2. Not knowing my current cashflow impairs my ability to make purchase decisions. Some important purchases such as investing in yourself(buying a good quality laptop etc) is pushed off while you spend your money buying silly things thinking you have the money for it. 
3. As a professional consultant, expense documentation is a requirement for tax filing. This is a super tedious and error prone process done at the end of the financial year. This leads to a lot of frustration at the end of financial year. 

Functionally Cashflowy is simply a good personal accountant, someone who focus on creating high accuracy accounts so that you have good visibility into your cash flow. Once you have clear visibility into how your money moves, you can command the flow of your money. When you are able to command money in the direction that you choose to, only then you become master of your own money. Until then you are a slave to your money. 


![Transactions](https://raw.githubusercontent.com/alexjv89/cashflowy/master/assets/images/transactions.png)
![Expense over time](https://raw.githubusercontent.com/alexjv89/cashflowy/master/assets/images/expense_over_time.png)
![State of accounts](https://raw.githubusercontent.com/alexjv89/cashflowy/master/assets/images/state_of_accounts_over_time.png)
![Expense per category/budget](https://raw.githubusercontent.com/alexjv89/cashflowy/master/assets/images/expense_per_category_budget.png)


## Ok cool, What does it really do?
Cashflowy paints highly accurate picture of your cashflow. It does this by processing transaction alert emails send by various banks, credit cards, wallets etc. Most Banks and other finacial institution sends you alert emails when you move money. Based on the data that is extracted from these emails, transaction records are auto created for you on cashflowy. This eliminates most of the grunt work for you in terms of recording a transaction. 

All you have to do now, is to write a description(so that you can remember the details of the transactions later) and categorize it(under what budget does it fall under). 

Did I mention that it shows you cool and fancy graphs so that you can make actionable decisions(eg. account snapshots can show your liquid cash and liability position).

## Financial transactions supported:
### ICICI
**Supported transactions:**
- Credit card expense (You paid someone with credit card)
- Debit card expense (You paid someone with debit card)
- Credit card refund (You got a refund via credit card)
- Internet Banking expense (You paid someone using net banking)


**Unsupported transactions:**
- UPI payments - ICICI bank does not send an alert email for UPI transactions.

### HDFC bank
**coming soon**

### SBI
**coming soon**

### City Bank
**coming soon**


## product:

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

## Long term roadmap
You can find out long term road map here - https://workflowy.com/s/DO_A.23p98lkvpC

## Self hosting guideline
- https://github.com/alexjv89/cashflowy/blob/master/docs/self_hosting.md

## Steps to create a parser for a document
- create the parser on docparser.com
- update config with docparser id
- update create_document.ejs to contain the doc filter id
- update convertSliToTransaction function in CashflowyService
- create the table view in viewDocument
