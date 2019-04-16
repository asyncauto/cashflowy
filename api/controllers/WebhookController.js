/**
 * WebhookController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var async = require('async')
var Bull = require( 'bull' );
// create our job queue
var queue = new Bull('queue',{redis:sails.config.bull.redis});

module.exports = {

    // this is the new doc parser - needs clean up - written by Alex
    docparser: function (req, res) {


        // console.log(req.body);
        if (req.query.secret != sails.config.docparser.webhook_secret)
            return res.status(403).json({ status: 'failure', error: 'athorization failed' });
        // req.body.remote_id?req.body.remote_id:1;
        // req.body.remote_id=1;
        var transformExtractedDataFromDocument=function(parsed_data,filter){
            Object.keys(parsed_data).forEach(function(key){
                if(parsed_data[key] && parsed_data[key].formatted)
                    parsed_data[key]=parsed_data[key].formatted;
            })
            if(filter.modifyParsedData)
                return filter.modifyParsedData(parsed_data);
            else 
                return parsed_data;
        }
        var parsed_data;
        
        async.auto({
            findDocument: function (cb) {
                // req.body.remote_id = 5;
                Document.findOne({ id: parseInt(req.body.remote_id) }).exec(cb);
            },
            findAccounts: ['findDocument', function(results, cb){
                var accouts = [];
                if(req.body.account_id)
                    accouts.push(req.body.account_id);
                else if(results.findDocument.parser_used=='sebtifdmvape')
                    _.forEach(req.body.accounts, function(account){
                        accouts.push(account.acc_no)
                    })
                var accounts = [];
                async.forEach(accouts, function(ac, cb){
                    // check for last 4 digits.
                    Account.findOrCreate({acc_number: {endsWith: ac.substr(-4)}, org: results.findDocument.org},
                        {acc_number: ac, org: results.findDocument.org, name: 'Auto Generated: '+ ac, type: "bank"}).exec(function(e, a){
                            if(e) return cb(e);
                            accounts.push(a);
                            return cb(null);
                        })
                }, function(err){
                    cb(err, accounts);
                })
            }],
            updateDocument: ['findAccounts' ,function (results,cb) {
                // cb(null);
                // type:doc_filter_type[results.findDocument.parser_used]
                var filter = _.find(sails.config.docparser.filters,{docparser_id:results.findDocument.parser_used});
                parsed_data=transformExtractedDataFromDocument(req.body,filter);
                Document.update({ id: parseInt(req.body.remote_id) }, { parsed_data: parsed_data, type:filter.type, accounts: _.map(results.findAccounts, 'id')}).exec(cb);
            }],
            // check if the document entered is duplicate of something else
            createStatementLineItems:['updateDocument',function(results,cb){
                console.log('statement line items will be created here\n\n\n\n');
                // Line items will only be created if they dont already exist. 
                var pos=0;
                // this can be abstracted out into a function and tested. 
                if(parsed_data.account_id)
                    var acc_no = parsed_data.account_id.substr(-4);
                else if(results.findDocument.parser_used=='sebtifdmvape')
                    var acc_no=_.find(parsed_data.accounts,{acc_type:'Savings'}).acc_no;
                // var acc_no=req.body.accounts[0].acc_no;
                async.eachLimit(parsed_data.transactions,1,function(t,next){
                    t.acc_no=acc_no;
                    // var sli_t=CashflowyService.transformSLIToTransactionFormat(sli);
                    var statement_line_item={
                        extracted_data:t,
                        document:results.findDocument.id,
                        pos:pos,
                        details:{
                            parser_used:results.findDocument.parser_used,
                            type:_.find(sails.config.docparser.filters,{docparser_id:results.findDocument.parser_used}).type,
                        },
                        org:results.findDocument.org // this is sort of reduntant
                    }
                    // statement_line_item.data=_.cloneDeep(t);
                    // statement_line_item.data.acc_no=acc_no;
                    var find={
                        document:results.findDocument.id,
                        pos:pos
                    }
                    // console.log('-----');
                    // console.log(statement_line_item);
                    // console.log(find);
                    pos++;
                    Statement_line_item.findOrCreate(find, statement_line_item).exec(next);
                },function(err){
                    cb(err);
                });
                // cb(null);
            }]
        }, function (err, results) {
            if (err){
                console.log('\n\n\nError');
                console.log(err);
                return res.status(500).json({ status: 'error' });
            }
            // console.log(results);
            res.json({ status: 'success' });
        })
        // res.send('ok');

    },

    mailgunInboudParser: function(req, res){
        // console.log(req.body);
        if (req.query.secret != sails.config.mailgun.webhook_secret)
            return res.status(403).json({ status: 'failure', error: 'athorization failed' });
        
        queue.add('parse_inbound_mail', req.body).then(function(){        
            res.ok();
		}).catch(function(err){
            if(err) return res.status(500).json({error: err.message});
        });
    }

};

