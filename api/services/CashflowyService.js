const fx = require('money');
var moment = require('moment-timezone');
fx.base = 'INR';
fx.rates = sails.config.fx_rates;

var convertSliToTransactionEvent = function (sli) {
	var t = {
		original_currency: sli.data.currency,
		createdBy: 'parsed_statement',
		type: 'income_expense',
		account: sli.data.acc_no,
		third_party: sli.data.paid_whom,
	}

	if (sli.data.date) {
		t.occuredAt = moment(sli.data.date, 'YYYY-MM-DD').tz('Asia/Kolkata').toDate()
	}

	if (sli.details.type == 'icici_bank' && sli.details.parser_used == 'sebtifdmvape') {
		if (!isNaN(parseFloat(sli.data.credit))) // is credit a number
			t.original_amount = parseFloat(sli.data.credit);
		else if (!isNaN(parseFloat(sli.data.debit)))
			t.original_amount = -parseFloat(sli.data.debit);

	} else if (sli.details.type == 'hdfc_credit_card' && sli.details.parser_used == 'bzqxicqhpsrk') {

		if (sli.data.dr_cr == 'Cr') // amount is creditted
			t.original_amount = parseFloat(sli.data.amount);
		else if (sli.data.dr_cr == 'Dr')
			t.original_amount = -parseFloat(sli.data.amount);
		t.third_party = sli.data.details;

	} else if (sli.details.type == 'hdfc_bank' && sli.details.parser_used == 'jrvqwmfuhapd') {
		if (parseFloat(sli.data.credit) && !isNaN(parseFloat(sli.data.credit))) // is credit a number
			t.original_amount = parseFloat(sli.data.credit);
		else if (parseFloat(sli.data.debit) && !isNaN(parseFloat(sli.data.debit)))
			t.original_amount = -parseFloat(sli.data.debit);

	} else if (sli.details.type == 'sbi_bank' && sli.details.parser_used == 'mzbvtiryowtr') {
		if (!isNaN(parseFloat(sli.data.credit))) // is credit a number
			t.original_amount = parseFloat(sli.data.credit);
		else if (!isNaN(parseFloat(sli.data.debit)))
			t.original_amount = -parseFloat(sli.data.debit);
		t.third_party = sli.data.description;
		if (sli.data.ref_cheque_no)
			t.third_party += '(' + sli.data.ref_cheque_no + ')';

	} else if (sli.details.type == 'yes_bank_credit_card' && sli.details.parser_used == 'kelnksvuxwcv') {
		if (sli.data.dr_cr == 'Cr') // amount is creditted
			t.original_amount = parseFloat(sli.data.amount);
		else if (sli.data.dr_cr == 'Dr')
			t.original_amount = -parseFloat(sli.data.amount);
		t.third_party = sli.data.details;

	} else if (sli.details.type == 'hsbc_credit_card' && sli.details.parser_used == 'qyflunkxpizn') {
		if (sli.data.dr_cr == 'Cr') // amount is creditted
			t.original_amount = parseFloat(sli.data.amount);
		else if (sli.data.dr_cr == 'Dr')
			t.original_amount = -parseFloat(sli.data.amount);
		t.third_party = sli.data.details;

	} else if (sli.details.type == 'icici_bank_credit_card' && sli.details.parser_used == 'cyfaymeukchi') {
		if (!sli.data.original_amount)
			sli.data.original_amount = sli.data.amount_inr;

		if (sli.data.dr_cr == 'CR') { // amount is creditted
			t.original_amount = parseFloat(sli.data.original_amount);
			t.amount_inr = parseFloat(sli.data.amount_inr);
		}
		else if (sli.data.dr_cr == 'DR') {
			t.original_amount = -parseFloat(sli.data.original_amount);
			t.amount_inr = -parseFloat(sli.data.amount_inr);
		}
		t.third_party = sli.data.details;
	}


	// t.amount_inr=t.original_amount;
	if (t.original_amount && !t.amount_inr)
		try {
			t.amount_inr = fx.convert(t.original_amount, { from: sli.data.currency, to: "INR" });
		} catch (err) {
			sails.config.sentry.withScope(scope => {
				scope.setTag('original_amount', t.original_amount);
				scope.setTag('currency', sli.data.currency);
				sails.config.sentry.captureException(err);
			});
			t.amount_inr = t.original_amount;
		}
	return t;
}

var findSimilarTransactionEvents = function (options, callback) {
	// console.log('this is the thing that is done');
	var t = options.t;
	t.occuredAt = new Date(t.occuredAt);
	var accounts = options.accounts;
	var escape = [];
	var query = 'select * from transaction_event';
	query += ' where';
	query += ` (("original_amount">${t.original_amount - 10} AND "original_amount"<${t.original_amount + 10}) `;
	query += ` OR ("original_amount">${-t.original_amount - 10} AND "original_amount"<${-t.original_amount + 10})) `;
	var from = new Date(new Date(t.occuredAt).setDate(t.occuredAt.getDate() - 2)).toISOString();
	var to = new Date(new Date(t.occuredAt).setDate(t.occuredAt.getDate() + 2)).toISOString();
	query += ` AND "occuredAt">'${from}' AND "occuredAt"<'${to}'`;
	query += ` AND "account" in (${accounts.join(',')})`;

	// query+=` AND account ='${results.getSnapshot.account}'`;
	query += ' ORDER BY "occuredAt" DESC';
	query += ' LIMIT 100';
	// console.log('\n\n\n\n '+query);
	// callback(null);
	sails.sendNativeQuery(query, escape, function (err, rawResult) {
		// console.log('\n\n\n\n');
		// console.log(results.getSnapshot);
		// console.log('\n\n\n\n')
		// console.log(rawResult.rows[0])
		// var prev_snap = rawResult.rows[0];
		if (err)
			callback(err);
		else
			return callback(err, rawResult.rows);
		// if(!rawResult.rows.length)
		// 	return callback('no similar transactions');
		// else
	});
}

var identifyExistingTransactionEvent = function (options) {
	similar_transactions = options.similar_transactions;
	new_t = options.new_t;
	if (similar_transactions.length == 0)
		return null;
	var existing_t = null;
	similar_transactions.forEach(function (st) {
		// expense can be
		// - expense
		// - tranfer 
		// income can be
		// - income
		// - transfer
		// Dates can be off by 48hrs both sides
		// Original amount can have a margin both sidespo
		// date band is already checked. 

		// Cases
		// 1 new_t is an expense, existing transaction is also an expense
		// 2 new_t is an expense, existing transaction is a transafer
		// 3 new_t is an income, existing transaction is also an income
		// 4 new_t is an income, existing transaction is a transfer

		// handling case 1 and 3
		if (new_t.account == st.account && new_t.type == st.type)
			existing_t = st;
	})
	return existing_t;
}

module.exports = {
	internal: {
		convertSliToTransactionEvent: convertSliToTransactionEvent,
		findSimilarTransactionEvents: findSimilarTransactionEvents,
		identifyExistingTransactionEvent: identifyExistingTransactionEvent,
	},
	findSimilarTransactionEvents: findSimilarTransactionEvents,
	afterCreate_SLI: function (sli, callback) {
		if (!sli.data.currency)
			sli.data.currency = 'INR'
		console.log('\n\n\n ------------');
		var t = convertSliToTransactionEvent(sli);
		console.log(t);
		// callback('error');
		var unique_transaction_flag = false;
		async.auto({
			getAccount: function (callback) {
				var find = {
					acc_number: {
						endsWith: t.account, // ends with the following number
					},
					org: sli.org
				}
				var create = { // incase the account does not exist, create account.
					acc_number: '' + t.account,
					org: sli.org,
					type: 'bank', // user might need to change this
					name: 'Auto generated account' + t.account,
				}
				Account.findOrCreate(find, create).exec(function (err, account, created) {
					callback(err, account);
				});
			},
			getOrgAccounts: function (callback) {
				// needed for finding similar transactions
				// to compare with transactions from accounts that belong to the same user.  
				Account.find({ org: sli.org }).exec(callback);
			},
			findSimilarTransactionEvents: ['getOrgAccounts', function (results, callback) {
				var options = { t: t, accounts: _.map(results.getOrgAccounts, 'id') };
				findSimilarTransactionEvents(options, callback);
			}],
			createTransactionEvent: ['getAccount', 'findSimilarTransactionEvents', function (results, callback) {
				//only create a transaction_event if its unique
				sli.transaction_event = null;
				t.account = results.getAccount.id;
				if (results.findSimilarTransactionEvents.length == 0) {
					unique_transaction_flag = true;
					Transaction_event.create(t).exec(callback);
				} else {
					//else create a doubtful transaction
					var dte = {
						transaction_event: t,
						similar_transaction_events: results.findSimilarTransactionEvents,
						sli: sli.id,
						org: sli.org
					}
					Doubtful_transaction_event.create(dte).exec(callback);
				}
			}],
			updateSli: ['createTransactionEvent', function (results, callback) {
				if (unique_transaction_flag) {
					sli.transaction_event = results.createTransactionEvent.id;
					Statement_line_item.update({ id: sli.id }, { transaction_event: sli.transaction_event }).exec(callback);
				} else
					callback(null);
			}]
		}, function (err, results) {
			if (err) {
				console.log('\n\n\n_____________');
				console.log('we got error for sli', sli);
				console.log(err);
				callback(err);
			} else
				callback();
		})
	},
	afterCreate_PE: function (pe, callback) {
		var t;
		var unique_transaction_flag;
		async.auto({
			getAccount: function (callback) {
				var find = {
					acc_number: {
						endsWith: pe.data.acc_number, // ends with the following number
					},
					org: pe.org
				}

				var create = { // incase the account does not exist, create account.
					acc_number: '' + pe.data.acc_number,
					org: pe.org,
					type: 'bank', // user might need to change this
					name: 'Auto generated account' + pe.data.acc_number,
				}
				Account.findOrCreate(find, create).exec(function (err, result, created) {
					callback(err, result);
				});
			},
			getToAccount: function (callback) {
				// console.log('getToAccount');
				if (pe.data.type == 'transfer') {
					var find = {
						acc_number: {
							endsWith: pe.data.acc_number, // ends with the following number
						},
						org: pe.org
					}

					var create = { // incase the account does not exist, create account.
						acc_number: '' + pe.data.acc_number,
						org: pe.org,
						type: 'investment', // user might need to change this
						name: 'Auto generated account' + pe.data.acc_number,
					}
					Account.findOrCreate(find, create).exec(callback);
				} else {
					callback(null);
				}
			},
			getAccounts: function (cb) {
				Account.find({ org: pe.org }).exec(cb);
			},
			findExactTransactionEvent: ['getAccount', 'getToAccount', function (results, callback) {
				//skip if it only contains information about account balance.
				if (pe.data.type == 'balance')
					return callback(null);
				var occuredAt = _.get(pe, 'data.occuredAt', new Date());

				t = {
					original_currency: pe.data.currency,
					createdBy: 'parsed_email',
					type: pe.data.type,
					account: results.getAccount.id,
					third_party: _.get(pe, 'data.third_party', null),
					original_amount: _.get(pe, 'data.original_amount', 0),
					amount_inr: _.get(pe, 'data.amount_inr', 0),
					occuredAt: _.isDate(occuredAt) ? occuredAt.toISOString() : occuredAt
				}
				// if transfer add to_account
				if (pe.data.type == 'transfer') {
					t.to_account = results.getToAccount.id;
				}

				Transaction_event.find(t).exec(function (err, tes) {
					if (tes.length)
						unique_transaction_flag = true
					return callback(null, tes[0]);
				})

			}],
			findSimilarTransactionEvents: ['getAccounts', 'findExactTransactionEvent', function (results, callback) {
				//skip if it only contains information about account balance.
				if (pe.data.type == 'balance')
					return callback(null);

				// if there is a unique transaction then skip
				if (unique_transaction_flag)
					return callback(null);

				var options = { t: t, accounts: _.map(results.getAccounts, 'id') };
				CashflowyService.findSimilarTransactionEvents(options, callback);
			}],
			createTransactionEvent: ['findSimilarTransactionEvents', function (results, callback) {
				//skip if it only contains information about account balance.
				if (pe.data.type == 'balance')
					return callback(null);

				// if there is a unique transaction then skip
				if (unique_transaction_flag)
					return callback(null);

				if (results.findSimilarTransactionEvents.length == 0) {
					unique_transaction_flag = true;
					Transaction_event.create(t).exec(callback);
				} else {
					//else create a doubtful transaction
					var dte = {
						transaction_event: t,
						similar_transaction_events: results.findSimilarTransactionEvents,
						parsed_email: pe.id,
						org: pe.org
					}
					Doubtful_transaction_event.create(dte).exec(callback);
				}
			}],
			updateParsedEmail: ['createTransactionEvent', function (results, callback) {
				//skip if it only contains information about account balance.
				if (pe.data.type == 'balance')
					return callback(null);
				if (unique_transaction_flag) {
					Parsed_email.update({ id: pe.id }, { transaction_event: results.createTransactionEvent.id }).exec(callback);
				} else {
					callback(null);
				}
			}],
			createSnapshotIfPossible: ['getAccount', function (results, callback) {
				// console.log('create snapshot');
				if (pe.data.balance_currency && pe.data.balance_amount) {
					var ss = {
						account: results.getAccount.id,
						createdBy: 'parsed_email',
						// takenAt: new Date(pe.data.date+' '+pe.data.time+'+5:30'),
						balance_currency: pe.data.balance_currency,
						balance: pe.data.balance_amount,
						takenAt: pe.data.occuredAt
					}
					Snapshot.create(ss).exec(callback);
				} else if (pe.data.credit_limit_currency && pe.data.credit_limit_amount && pe.data.available_credit_balance) {
					var ss = {
						account: results.getAccount.id,
						createdBy: 'parsed_email',
						// takenAt: new Date(pe.data.date+' '+pe.data.time+'+5:30'),
						balance_currency: pe.data.credit_limit_currency,
						balance: pe.data.available_credit_balance - pe.data.credit_limit_amount,
						takenAt: pe.data.occuredAt
					}
					Snapshot.create(ss).exec(callback);
				} else {
					callback(null);
				}
			}]
		}, callback)
	}
}