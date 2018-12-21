var async = require('async');
module.exports = {

	createTransactionFromSLI: function (sli, cb) {
		async.auto({
			findSLI: function (cb) {
				Statement_line_item.findOne(sli.id).populate('document')
					.populate('user').exec(cb);
			},
			findOrCreateTransaction: ['findSLI', function (results, cb) {
				//if transaction is present return.
				if (results.findSLI.transaction) return cb(null, { id: results.findSLI.transaction });

				switch (results.findSLI.document.parser_used) {
					// case for hdfc credit card statments. It straight forword for hdfc as there were not other source i.e email from where we can extract data
					case sails.config.docparser_filters.hdfc_credit_card:
						var find = {
							original_currency: 'INR',
							createdBy: 'parsed_document',
							type: 'income_expense',
							account: results.findSLI.extracted_data.acc_id,
							third_party: results.findSLI.extracted_data.details,
							amount_inr: results.findSLI.extracted_data.dr_cr == 'Dr' ? -1 * parseFloat(results.findSLI.extracted_data.amount) : parseFloat(results.findSLI.extracted_data.amount),
							occuredAt: new Date(results.findSLI.extracted_data.date)
						}

						var create = {
							original_currency: 'INR',
							createdBy: 'parsed_document',
							type: 'income_expense',
							account: results.findSLI.extracted_data.acc_id,
							third_party: results.findSLI.extracted_data.details,
							amount_inr: results.findSLI.extracted_data.dr_cr == 'Dr' ? -1 * parseFloat(results.findSLI.extracted_data.amount) : parseFloat(results.findSLI.extracted_data.amount),
							original_amount: results.findSLI.extracted_data.dr_cr == 'Dr' ? -1 * parseFloat(results.findSLI.extracted_data.amount) : parseFloat(results.findSLI.extracted_data.amount),
							occuredAt: new Date(results.findSLI.extracted_data.date)
						}
						Transaction.findOrCreate(find, create).exec(cb)
						break;
					// TODO: for other type of statements we need to handle for duplicate transactions.
					default:
						break;
				}
			}],
			updateSLI: ['findOrCreateTransaction', function (results, cb) {
				Statement_line_item.update({ id: sli.id }, { transaction: results.findOrCreateTransaction.id }).exec(cb);
			}]
		}, function (err, results) {
			cb(err, results);
		});
	}
}