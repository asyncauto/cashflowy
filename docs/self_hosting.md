# Self Hosting Cashflowy

This is a guide for self hosting cashflowy on your own private server. 

## Who is this for? 
This guide is written with the assumption that you are a developer and you have basic understanding of cloud hosting. 

If you are super concerned about your data and self-hosting option is for you. Cashflowy is designed as a web application with a server. This guide should help you spin up the server on your local machine or your own cloud machine. 

If you are looking for hastle free setup, the hosted version on app.cashflowy.in is best suited for you. 

## Basic requirements

This assumes that you have nodejs installed on your machine. If not, install Nodejs and NPM (node package manager). 

## Choice of machine

### local machine - install cashflowy on your laptop
To try out cashflowy, self hosted version, this might be the easiest way to get started. You can install cashflowy on your mac or PC. This approach has a major drawback. Cashflowy is a web app. You will find using cashflowy on mobile as a useful feature. You might want to update information on cashflowy via a mobile phone. This is only possible if your self-hosted cashflowy server is available over the internet and has good uptime. This might be a challenge. If you like the self-hosted version, if you dont have hosting infrastructure, you might find it simpler to deploy cashflowy on a cloud server via AWS/Google cloud/DigitalOcean etc.

TLDR: running cashflowy on local machine is recommended for testing cashflowy or for development purpose. 

### remote machine - install cashflowy on cloud server

Cloud servers are good because they can ensure that you get good uptimes for the servers that you host. When you are self-hosting cashflowy, we recommend this option. 

## Setup

### Installing from github
**Pre-requisite:**
1. Install Nodejs and NPM
2. Install postgres and psql
3. Install Redis


**Setup Summary:**
1. Clone Cashflowy master branch - `git clone https://github.com/alexjv89/cashflowy`
2. `cd cashflowy`
3. `npm install` - this installs all dependancies 
4. Create a database called `cashflowy` on your database server(local/co-hosted or remote)
5. Create a google gmail app
6. Setup an account with docparser. 
7. Update configs on local.js
8. start server - `node app.js`. Cashflowy should be running on http://localhost:1337
9. Create an account by clicking on signup
10. Configure your app to read from your gmail account
11. Do an initial crawl
12. Configure cron jobs
13. Make sure your server is always up. Use PM2 or AWS elastic beanstalk. 

## Installation on AWS EC2 walk though 
Walkthough of setting up Cashflowy on an EC2 machine on AWS.

### Launch AWS console and launch a EC2 machine (min t2.micro) with ubuntu on it.

### ssh into the machine.

### Install Nodejs

```
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
```
Verify is Nodejs and NPM is installed

```
node -v
npm -v
```
### Clone the repo

`git clone https://github.com/alexjv89/cashflowy`

### Install all dependencies

`npm install`

At this point Cashflowy server is now installed. You can try running the server with `node app.js` or `npm start`. It will not work, because we have not configured the server with database etc.



### Install redis

`sudo apt-get install redis`

Run redis server

`redis-server`

### Install postgres

```
// access root
sudo su -

// install postgres
apt-get install postgresql postgresql-contrib

// configure postgresql to run on server boot
update-rc.d postgresql enable

// start postgresql server
service postgresql start
```

**Create database.**

```
sudo -u postgres psql
// you can change alex to a user name of your preference. Similarly you can change the password as well
create user alex createdb password 'randompass';

create database cashflowy owner alex;

show database \l
```

change user back to ubuntu
`su - ubuntu`

### Setting up a gmail app to process your transaction emails.

In order to programatically access your email, gmail provides apis. To do that you need to create an `app` with google. 

https://developers.google.com/gmail/api/

click on quick start(https://developers.google.com/gmail/api/quickstart/js).

on that page, under step 1, a), click on the wizard.

create a project -> continue

Click `get credentials`

Under the "where will you be calling the api from " dropdown choose - "Other UI"

Under which API, choose - Gmail API
Under what data, choose user data

Enter a name for your app

Define email address and product name to be shown to user. Download the credentials.

This downloaded google app credentials file contains the details missing in the local.js file that you created earlier. 

Copy paste the credentials into local.js configs

### Allow your gmail app that you created to access your email.
Now you have a google app. You server is connected to your google app. The google app is generic. It still does not have access to your email content yet. You need to autherize the google app that you created to access your gmail account. Lets do that now. 

Run getAuthToken.js
`node getAuthToken.js`

Open the link that you get from the terminal. Here you are giving access permission to your app to access your transaction emails. Once you authentiate you will get a code. Paste that code back in the terminal. Once you do that, a file called token.js will be created in cashflowy folder. This file contains the auth token, that specifically allows your gmail app(hence your cashflowy server) to access your gmail content. 

To view the token in the terminal type

cat token.json

Copy paste this token in the cashflowy UI. 
In cashflowy, click create email. Enter your email address and then paste the result of `cat token.json`

Now cashflowy has access to read your transaction emails. Now lets process your emails to extract financial data.

### Setting up config
Inside config folder, create a file called local.js

```
cd cashflowy
sudo nano config/local.js
```

This config file should contain the following structure. Some of the configs are prefilled for you. Some of them you will need to fill with your custom settings. 

```
module.exports = {
  gmail:{
    "installed":{  
      "client_id":"", // fill this
      "project_id":"", // fill this
      "auth_uri":"https://accounts.google.com/o/oauth2/auth",
      "token_uri":"https://www.googleapis.com/oauth2/v3/token",
      "auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs",
      "client_secret":"", // fill this
      "redirect_uris":[  
        "urn:ietf:wg:oauth:2.0:oob",
        "http://localhost",
      ]
    }
  },
  connections:{
    mainPostgresqlServer:{
      adapter: 'sails-postgresql',
      host: 'localhost', // edit this
      user: 'alex', // // edit this
      password: 'randompassword', // edit this
      database: 'cashflowy'
    }
  },
  redis_kue: {
    host: '127.0.0.1',
    port: 6379,
    db: 1,
  },
  session:{
    adapter: 'connect-redis',
    host: '127.0.0.1',
    port: 6379,
    db: 0,
    secret:'sdfasoudfo2jouh23bskhbdfalskjdf' // edit this - some random charectors will do
  },
  mailgun:{
    api_key:'key-sdasfasfdasf',
    domain:'localhost'
  },
  slack_webhook:'https://slack.com/sadfasfasfsfd',
  background_secret:'aslfhlaksbfalskhbfdladshbflkasj2346ncaubdlai2shflasdflhasbdflks234alkjfnslcnalsjnf',
  models:{
    migrate:'safe' // sails does not do any db migrations. 
    // migrate:'alter' // to let sails auto migrate database tables
  }
};

```
### Accessing your cashflowy deployment via the browser
Even without filling in the missing details in the config file, if you copy paste the above config to /cashflowy/env/local.js. The server should lift up. 

Lift cashflowy server by running `node app.js` from /cashflowy folder. The server should lift now(as seen via terminal).  

**Find public IP address**
From AWS console, find out the IP address of your new EC2 machine.

Change security group setting so that your server is available on the internet.
You need to allow port 1337 to be accessible in the security group. 

Now if you access the IP address followed by the port (eg. 18.52.52.52:1337), you should see the login page.

### Auto generating tables in your database
Click on signup. Enter details and submit form. You should get an error on the screen. This is because even if the database is created, the tables inside the database is not created yet. Sails can auto generate tables for you. Lets do that now.

In terminal break the server with control C. Go to locals and update models.migrate from 'safe' to 'alter'. Now lift the server again with node app.js. This time, sails at the time of lifting the server will auto create the tables for you. This is not a safe configuration. You can loose data if you leave the migrate settings to alter. Lets change it immediately, as there is a lot of chance of forgetting about it. Break the server and change the migrate settings from alter back to safe.

Run the server again and try signup again. This time it should work.

### Extracting financial data from gmail

```
curl -X POST 'http://localhost:1337/background/surface_crawl?secret=aslfhlaksbfalskhbfdladshbflkasj2346ncaubdlai2shflasdflhasbdflks234alkjfnslcnalsjnf&user=1' -F user_id=1
```
Now lift the server again with node app.js and you will notice a lot of activity in the terminal. If you navigate to /transactions you will start seeing transactions extracted from your data.

## Video of this deployment:
Part 1 - https://youtu.be/MgtNZz77MHU
Part 2 - https://youtu.be/45EUKULYn_g
Part 3 - https://youtu.be/GXlgqATFQoA


ref:

https://www.postgresql.org/message-id/4D958A35.8030501@hogranch.com
https://www.godaddy.com/garage/how-to-install-postgresql-on-ubuntu-14-04/
