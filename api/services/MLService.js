var AWS = require('aws-sdk');
var machinelearning = new AWS.MachineLearning({
    accessKeyId: sails.config.aws.key,
    secretAccessKey: sails.config.aws.secret,
    region: sails.config.aws.region
});

var async = require('async');

module.exports = {
    predictCategory: function (transaction, cb) {
        async.auto({
            getAccount: function (cb) {
                Account.findOne(transaction.account).exec(cb);
            },
            createPredictionPayload: ['getAccount', function (results, cb) {
                var payload = {
                    // createdBy: transaction.createdBy,
                    // description: transaction.description,
                    // account: transaction.account ? transaction.account.toString() : '',
                    // to_account: transaction.to_account ? transaction.to_account.toString() : '',
                    third_party: transaction.third_party,
                }
                // payload = _.pick(payload, _.identity);
                cb(null, payload)
            }],
            getPrediction: ['createPredictionPayload', function (results, cb) {
                var params = {
                    MLModelId: sails.config.aws.category_model_id, /* required */
                    PredictEndpoint: sails.config.aws.prediction_endpoint, /* required */
                    Record: results.createPredictionPayload
                };
                machinelearning.predict(params, function (err, data) {
                    if (err) {
                        console.log(err, err.stack);
                        return cb(err);
                    } // an error occurred
                    else return cb(null, data);           // successful response
                });
            }],
            findOrCreateCategory: ['getPrediction', function (results, cb) {
                // for initial trail, only categorize if category belongs to user
                var category_name = results.getPrediction.Prediction.predictedLabel
                Category.findOne({ name: category_name, user: results.getAccount.user }).exec(cb);
            }],
            addCategoryToTransaction: ['findOrCreateCategory', function (results, cb) {
                if (!results.findOrCreateCategory) return cb(null);
                Transaction.update(transaction.id, { category: results.findOrCreateCategory.id }).exec(cb);
            }],
            addPredictionTag: ['findOrCreateCategory', function (results, cb) {
                if (!results.findOrCreateCategory) return cb(null);

                Tag.findOrCreate({ name: 'predicted_category', type: 'global' },
                    { name: 'predicted_category', type: 'global' }).exec(function (err, tag) {
                        tag.transactions.add(transaction.id)
                        tag.save(cb);
                    })
            }]
        }, cb);
    }
}