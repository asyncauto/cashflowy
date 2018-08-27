const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
var async = require('async');
// If modifying these scopes, delete credentials.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Gmail API.
  // authorize(JSON.parse(content), listLabels);
  authorize(JSON.parse(content), listMessages);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return callback(err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.labels.list({
    userId: 'me',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const labels = res.data.labels;
    if (labels.length) {
      console.log('Labels:');
      labels.forEach((label) => {
        console.log(`- ${label.name}`);
      });
    } else {
      console.log('No labels found.');
    }
  });
}

function listMessages(auth) {
  console.log(auth);
  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.messages.list({
    userId: 'me',
    q:'from:credit_cards@icicibank.com',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const messages = res.data.messages;
    if (messages.length) {
      console.log('messages:');
      // messages.forEach((message) => {
      //   console.log(`- ${message}`);
      // });
      // 
      var count = 0;
      async.eachLimit(messages,1,function(m,next){
        console.log(count);
        count++;
        viewMessage(auth,m.id,next);
      },function(err){
        console.log('everything done');
      })
      // messages.forEach(function(m,i){
      //   // console.log(m);
      //   if(i==19)
      //     viewMessage(auth,m.id,null);
        

      // });
    } else {
      console.log('No messages found.');
    }
  });
}
var atob = require('atob');

function viewMessage(auth,m_id,callback){
  console.log("\n\n\n====== m_id="+m_id);
  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.messages.get({
    userId: 'me',
    id:m_id
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    // const messages = res.data.messages;
    // console.log(res.data);
    // console.log(res.data.payload.parts);
    var body;
    if(res.data.payload.body.size!=0)
      body=res.data.payload.body.data;
    else{ // these are emails containing attachments
      res.data.payload.parts.forEach(function(part){
        if(part.mimeType=='text/html'){
          body=part.body.data;
        }
      })
    }

    var b = atob(body.replace(/-/g, '+').replace(/_/g, '/') ); 
    // console.log(b);
    const cheerio = require('cheerio')
    const $ = cheerio.load(b);
    // console.log($('body').text());
    var data = extractData($('body').text());
    console.log('--------ED---------');
    data.m_id=m_id;
    console.log(data);
    fs.appendFile('data.txt', JSON.stringify(data)+'\r\n', (err) => {
      if (err) return console.error(err);
      console.log('data writen to file');
      if(callback)
        callback(null);
    });
    // if (messages.length) {
    //   console.log('messages:');
    //   messages.forEach((message) => {
    //     console.log(`- ${message}`);
    //   });
    //   messages.forEach(function(m){
    //     console.log(m);
    //   });
    // } else {
    //   console.log('No messages found.');
    // }
  });
}

var extract_config = {
  fields:[
    {
      name:'credit_card_last_4_digits',
      type:'integer',
      filters:[
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'Your ICICI Bank Credit Card'
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'has been used for a transaction of'
        },
        {
          type:'trim',
        },
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'XX'
        },
        {
          type:'trim',
        },
      ]
    },
    {
      name:'currency',
      type:'string',
      filters:[
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'Thank you for using ICICI Bank Credit Card.'
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'If you have not authorised this transaction'
        },
        {
          type:'trim',
        },
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'has been used for a transaction of'
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'The available credit balance on your card is'
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:' at '
        },
        {
          type:'trim',
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:' '
        },
        {
          type:'trim',
        },
      ]
    },
    {
      name:'amount',
      type:'float',
      filters:[
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'Thank you for using ICICI Bank Credit Card.'
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'If you have not authorised this transaction'
        },
        {
          type:'trim',
        },
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'has been used for a transaction of'
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'The available credit balance on your card is'
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:' at '
        },
        {
          type:'trim',
        },
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:' '
        },
        {
          type:'replace',
          options:{
            replace:',',
            with:'',
          }
        },
        {
          type:'trim',
        },
      ]
    },
    {
      name:'whom_you_paid',
      type:'string',
      filters:[
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'Thank you for using ICICI Bank Credit Card.'
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'If you have not authorised this transaction'
        },
        {
          type:'trim',
        },
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'has been used for a transaction of'
        },
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:' at '
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'The available credit balance on your card is'
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:' on '
        },
        {
          type:'trim',
        },
      ]
    },
    {
      name:'available_credit_balance',
      type:'float',
      filters:[
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'Thank you for using ICICI Bank Credit Card.'
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'If you have not authorised this transaction'
        },
        {
          type:'trim',
        },
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'The available credit balance on your card is'
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'and total credit limit'
        },
        {
          type:'trim',
        },
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:' '
        },
        {
          type:'replace',
          options:{
            replace:',',
            with:'',
          }
        },
        {
          type:'trim',
        },
      ]
    },
    {
      name:'date',
      type:'string',
      filters:[
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'Thank you for using ICICI Bank Credit Card.'
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'If you have not authorised this transaction'
        },
        {
          type:'trim',
        },
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'has been used for a transaction of'
        },
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:' on '
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'The available credit balance on your card is'
        },
        {
          type:'trim',
        },
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'('
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:')'
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:';'
        },
        {
          type:'trim',
        },
      ]
    },
    {
      name:'time',
      type:'string',
      filters:[
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'Thank you for using ICICI Bank Credit Card.'
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'If you have not authorised this transaction'
        },
        {
          type:'trim',
        },
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'has been used for a transaction of'
        },
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:' on '
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'The available credit balance on your card is'
        },
        {
          type:'trim',
        },
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:'('
        },
        {
          type:'find_end_position',
          criteria:'text_match_before',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:')'
        },
        {
          type:'find_start_position',
          criteria:'text_match_after',
          options:{
            case_sensitive:false,
            beginning_of_line:true
          },
          q:';'
        },
        {
          type:'trim',
        },
      ]
    },
  ]

}



var extractData = function (body){

  var ed={};
  extract_config.fields.forEach(function(field){
    ed[field.name]=extractOneField(field,body);
  });
  return ed;
}
var extractOneField=function(field,body){
  var filters=field.filters;
  // console.log(typeof filters)
  // console.log(filters)
  filters.forEach(function(f){
    if(f.type == 'find_start_position'){
      var end = body.length;
      if(f.criteria=='text_match_after')
        var start = body.indexOf(f.q)+f.q.length;
      else if(f.criteria=='text_match_before')
        var start = body.indexOf(f.q);
      body=body.substring(start,end);
    }
    else if(f.type == 'find_end_position'){
      var start = 0;
      if(f.criteria=='text_match_after')
        var end = body.indexOf(f.q)+f.q.length;
      else if(f.criteria=='text_match_before')
        var end = body.indexOf(f.q);
      body=body.substring(start,end);
    }else if(f.type=='trim'){
      body=body.trim(body);
    } else if(f.type=='replace'){
      var temp = body.split(f.options.replace);
      body=temp.join(f.options.with);
    }
    // console.log('\n\n\n\n*********');
    // console.log(start);
    // console.log(end);
  })
  var output;
  if(field.type=='float')
    output = parseFloat(body);
  else if(field.type=='integer')
    output = parseInt(body);
  else 
    output = body.replace(/  +/g, ' '); // replaces multiple spaces. ref - https://stackoverflow.com/questions/1981349/regex-to-replace-multiple-spaces-with-a-single-space
    // output = body.replace(/\s\s+/g, ' '); replaces multiple spaces tabs and new lines
  return output;
}























