# proxyfor.me
Democracy by Matched Proxy client and server

# Purpose
This open-source archive is being made available primarily so that correct operation can be verified by any interested party and so that it can be reviewed for security flaws. Contributions to improve aethetics, feature set, and/or performance are of course welcome but if you have to choose, please invest the time in code review rather than enhancement.

# Overview
Live example can be viewed at https://www.proxyfor.me/ Release notes can be found in Help system (help.component.html).

The server component (main directory) consists of a NodeJS + Express process connecting to standard-config MongoDB process running in an AWS (Amazon Linux) EC2 instance. AWS SES (Simple Email Service) is used via the AWS API for sending email and text messages. The client (ui directory) is an Angular Single Page Application (SPA). Both are written in TypeScript which is transpiled to JavaScript (es5). The two components exchange data using classes defined in classes.ts to make transfer of data between client and server more straightforward.

# Setup
First install NodeJS (https://nodejs.org/en/), MongoDB (https://www.mongodb.com/download-center#community), TypeScript (npm install -g typescript), Angular CLI (npm install -g @angular/cli), and your development environment (for developing on Windows we recommend https://code.visualstudio.com/download).

The Node libraries required are all specified in package.json, so "npm install" should get them all for you. Then run "tsc" in the main (server) directory and "ng build" in the app directory (ba.bat and bs.bat will do this for you on Windows) to transpile the .ts files to .js.

To run the app, create an empty directory for MongoDB (C:\data\db on Windows), start up a mongodb process in a shell (magic incantations for Windows can be found at the top of server.ts), then create another shell and run "node server.js" to start up the proxyfor.me server. Default port is standard HTTP (port 80) which is open on Windows but requires root permission to run on other OSs (you can change the port in server.ts). Then connect to "localhost" from the browser.

# Testing with bots (simulated data)
When run with an empty database the template proposals in "proposals.json" will be loaded, 100 direct voting bots and 100 proxy bots will be created, and the system will create votes and posts for them. You can use this dummy data to test out the UI and the server's proxy matching routines. To check or work on the email routines you'll need to sign up for AWS (it runs fine in the free tier, but you will need to contact AWS support and ask them to let you out of the sandbox) and also change the bot-generating routines and aws-ses-config.json.

Real raw data (via mongodump and mongorestore, albeit with profile contact information redacted) will be made available upon request to gm@proxyfor.me for more advanced testing or data analysis.

# To-do list
Need to make registration and voting more bot-resistant (captcha, email validation, ip-filtering, etc.)

Bundle the client into apps that can be distributed in the Apple and Google app stores and then extend those apps to take advantage of native features (e.g., via PhoneGap).

Expand admin features and ui (monitoring, add/edit/delete profiles, etc.)

Create a budgeting system so that the same mechanism used for proposal matching can be applied to tweaking and approving a budget.

Eventually the system will need to be extended to support acquisition and maintenance of Credentials and for maintaining tax and health-care records.