var _=require('lodash')
var sample_email_text=require('../test/fixtures_email_text.js')
// var body_parsers=require('../api/filters/PaytmFilter.js').body_parsers;
// var email_body=sample_email_text.PaytmFilter.money_added_v1;




console.log('==========');
// var GeneralService=require('../api/services/GeneralService.js')

// var sails = require('sails');
// sails.config={}

// sails.config.filetypparser=require('../config/filetypeparser.js')
var sails = require('sails');

// Before running any tests...
before(function(done) {
  // Increase the Mocha timeout so that Sails has enough time to lift, even if you have a bunch of assets.
  // this.timeout(5000);

  sails.lift({
    // Your Sails app's configuration files will be loaded automatically,
    // but you can also specify any other special overrides here for testing purposes.

    // For example, we might want to skip the Grunt hook,
    // and disable all logs except errors and warnings:
    hooks: { grunt: false },
    log: { level: 'warn' },

  }, function(err) {
    if (err) { return done(err); }

    // here you can load fixtures, etc.
    // (for example, you might want to create some records in the database)

    return done();
  });
});

var sample_file_text=require('../test/fixtures_file_text.js')

var assert = require('assert');
describe('Detect file type', function() {
  describe('SBI Bank', function() {
    it('should return sbi_bank when the value is SBI statement', function() {
      assert.equal(GeneralService.detectFileType(sample_file_text.sbi_bank), 'sbi_bank');
    });
  });
  describe('HDFC Bank', function() {
    it('should return hdfc_bank when the value is hdfc bank statement', function() {
      assert.equal(GeneralService.detectFileType(sample_file_text.hdfc_bank), 'hdfc_bank');
    });
  });
  describe('HDFC Credit Card', function() {
    it('should return hdfc_credit_card when the value is hdfc credit card statement', function() {
      assert.equal(GeneralService.detectFileType(sample_file_text.hdfc_credit_card), 'hdfc_credit_card');
    });
  });
});



describe('Extract data from email', function() {
  describe('PaytmFilter', function() {
    var body_parsers=require('../api/filters/PaytmFilter.js').body_parsers;
    console.log('body par:');
    console.log(body_parsers);
    describe('money_added_v1', function() {
      var email_body=sample_email_text.PaytmFilter.money_added_v1.email_body;
      var test_result_values=sample_email_text.PaytmFilter.money_added_v1.test_result_values;
      var fields=_.find(body_parsers, {'version': 'money_added_v1'}).fields;
      fields.forEach(function(field){
        describe(`${field.name}`, function() {
          it(`should return ${field.name} when the field and email body is passed`, function() {
            assert.equal(EmailParserService.extractOneField(field,email_body), test_result_values[field.name]);
          });
        });
        
      })
    });
  });
});