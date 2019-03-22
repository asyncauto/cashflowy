# Auto forwarding filters. 

For cashflowy to process your email, you need to forward the relevant email to our mailing address (postmaster@mail.cashflowy.in). You can manually forward one off emails, but you can also setup auto-forwarders to forward the relevant mails to cashflowy automatically. 

We are maintaining a list of filters here - https://github.com/cashflowy/cashflowy/blob/master/docs/filters.xml . The list is periodically updated. 

## Instructions for adding auto forwarding filters. 

### 1. Setup postmaster@mail.cashflowy.in as a forwarding address 

You can do with in Gmail by clicking on the `gear icon` and from the menu choose `settings`. Then click on `Forwarding and POP/IMAP` tab. Under this tab, under the `forwarding` section, click on `Add a forwarding address` button. Enter the email address - postmaster@mail.cashflowy.in and follow the instructions on screen. You will to enter the code send to that email to verify that you have access to the email address. The Cashflowy team will share this code with you. Enter that code and you can now setup auto-forwarding to this email address. 

This video is a rough walk through - https://www.youtube.com/watch?v=Liwq1iZaMk8

### 2. Setup the filters and autoforward emails

Gmail filters are useful if you want to do some categorization or organization of your email box. In this case we will use filters to forward emails to cashflowy. 

Save this file to disk - https://raw.githubusercontent.com/cashflowy/cashflowy/master/docs/filters.xml . 

Then go to gmail and click on the `gear icon`. From the menu select `settings`. Click on `Filters and Blocked Addresses` tab. Scroll down to the bottom and click on `Import filters`. Upload the file that you just downloaded. Gmail will give you an option to choose the filters that you want to setup from the file uploaded. Click ok and you are done. 

From now onwards all relavant emails will be forwarded to cashflowy. Past emails will be forwarded. You will need to manually forward past emails. 

In the filters that you just uploaded, every email that is autoforwarded, a label - `cashflowy` is also applied. This helps you visually identify emails that are automatically forwarded to cashflowy. 
