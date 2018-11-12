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

#### 1. Clone Cashflowy master branch

#### 11. Do an initial crawl

#### 13. Make sure your server is always up
Cashflowys server, Redis and Postgress needs to be up and running all the time. You can run Redis and Postgres as a background service. 

Use pm2 to keep your server running all the time. When your server breaks, pm2 will make sure your server is automatically restarted. You will need this if you are running cashflowy on your machine or aws ec2. If you use AWS elastic beanstalk single instance, then you will not need pm2. Beanstalk will take care of most of the requirements for you. 





