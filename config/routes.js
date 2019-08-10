/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
  * etc. depending on your default view engine) your home page.              *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  'GET /': 'MainController.landingPage',
  'GET /dashboard': 'MainController.landingPage',
  'GET /org/:o_id/dashboard':'MainController.dashboard',
  'GET /debug':'MainController.debug',
  
  'GET /org/:o_id/emails':'MainController.listEmails',
  'GET /org/:o_id/email/create':'MainController.createEmail',
  'POST /org/:o_id/email/create':'MainController.createEmail',
  'GET /org/:o_id/email/:id/edit':'MainController.editEmail',
  'POST /org/:o_id/email/:id/edit':'MainController.editEmail',
  'GET /org/:o_id/email/:id':'MainController.viewEmail',

  'GET /org/:o_id/parsed_emails/': 'MainController.listParsedEmails',
  'GET /org/:o_id/parsed_email/:pe_id': 'MainController.viewParsedEmail',
  'POST /org/:o_id/parsed_email/:id/retry': 'MainController.retryParsedEmail',
  'GET /org/:o_id/parse_failures/': 'MainController.listParseFailures',
  'GET /org/:o_id/parse_failure/:pf_id': 'MainController.viewParseFailure',
  'POST /org/:o_id/parse_failure/:id/retry': 'MainController.retryParseFailure',
  
  'GET /org/:o_id/accounts':'MainController.listAccounts',
  'GET /org/:o_id/account/create':'MainController.createAccount',
  'POST /org/:o_id/account/create':'MainController.createAccount',
  'GET /org/:o_id/account/:id':'MainController.viewAccount',
  'GET /org/:o_id/account/:id/edit':'MainController.editAccount',
  'POST /org/:o_id/account/:id/edit':'MainController.editAccount',
  // 'GET /account/:id/delete':'MainController.deleteAccount',
  // 'POST /account/:id/delete':'MainController.deleteAccount',

  
  'GET /org/:o_id/transactions':'MainController.listTransactions',
  'GET /org/:o_id/transaction/create':'MainController.createTransaction',
  'POST /org/:o_id/transaction/create':'MainController.createTransaction',
  'GET /org/:o_id/transaction/:id':'MainController.viewTransaction',
  'GET /org/:o_id/transaction/:id/edit':'MainController.editTransaction',
  'POST /org/:o_id/transaction/:id/edit':'MainController.editTransaction',
  'PUT /org/:o_id/tli/:id':'MainController.updateTli',
  'GET /org/:o_id/transaction/:id/delete':'MainController.deleteTransaction',
  'POST /org/:o_id/transaction/:id/delete':'MainController.deleteTransaction',


  'GET /org/:o_id/invoices': 'MainController.listInvoices',
  'GET /org/:o_id/invoice/create': 'MainController.createInvoice',
  'POST /org/:o_id/invoice/create': 'MainController.createInvoice',
  'GET /org/:o_id/invoice/:i_id/edit': 'MainController.editInvoice',
  'POST /org/:o_id/invoice/:i_id/edit': 'MainController.editInvoice',
  'GET /org/:o_id/invoice/:i_id/delete': 'MainController.deleteInvoice',
  'POST /org/:o_id/invoice/:i_id/delete': 'MainController.deleteInvoice',

  'GET /org/:o_id/loans': 'MainController.listLoans',
  'GET /org/:o_id/loan/create': 'MainController.createLoan',
  'POST /org/:o_id/loan/create': 'MainController.createLoan',
  'GET /org/:o_id/loan/:i_id/edit': 'MainController.editLoan',
  'POST /org/:o_id/loan/:i_id/edit': 'MainController.editLoan',
  'GET /org/:o_id/loan/:i_id/delete': 'MainController.deleteLoan',
  'POST /org/:o_id/loan/:i_id/delete': 'MainController.deleteLoan',


  'GET /org/:o_id/assets': 'MainController.listAssets',
  'GET /org/:o_id/asset/create': 'MainController.createAsset',
  'POST /org/:o_id/asset/create': 'MainController.createAsset',
  'GET /org/:o_id/asset/:i_id/edit': 'MainController.editAsset',
  'POST /org/:o_id/asset/:i_id/edit': 'MainController.editAsset',
  'GET /org/:o_id/asset/:i_id/delete': 'MainController.deleteAsset',
  'POST /org/:o_id/asset/:i_id/delete': 'MainController.deleteAsset',


  'GET /org/:o_id/snapshots':'MainController.listSnapshots',
  'GET /org/:o_id/snapshot/create':'MainController.createSnapshot',
  'POST /org/:o_id/snapshot/create':'MainController.createSnapshot',
  'GET /org/:o_id/snapshot/:id/edit':'MainController.editSnapshot',
  'POST /org/:o_id/snapshot/:id/edit':'MainController.editSnapshot',
  'GET /org/:o_id/snapshot/:id/delete':'MainController.deleteSnapshot',
  'POST /org/:o_id/snapshot/:id/delete':'MainController.deleteSnapshot',

  'GET /org/:o_id/categories':'MainController.listCategories',
  'GET /org/:o_id/category/create':'MainController.createCategory',
  'POST /org/:o_id/category/create':'MainController.createCategory',
  'GET /org/:o_id/category/:id':'MainController.viewCategory',
  'GET /org/:o_id/category/:id/edit':'MainController.editCategory',
  'POST /org/:o_id/category/:id/edit':'MainController.editCategory',
  'GET /org/:o_id/category/:id/delete':'MainController.deleteCategory',
  'POST /org/:o_id/category/:id/delete':'MainController.deleteCategory',

  'GET /org/:o_id/tags':'MainController.listTags',
  'GET /org/:o_id/tag/create':'MainController.createTag',
  'POST /org/:o_id/tag/create':'MainController.createTag',
  'GET /org/:o_id/tag/:id':'MainController.viewTag',
  'GET /org/:o_id/tag/:id/edit':'MainController.editTag',
  'POST /org/:o_id/tag/:id/edit':'MainController.editTag',


  'GET /org/:o_id/rules':'MainController.listRules',
  'GET /org/:o_id/rule/create':'MainController.createRule',
  'GET /org/:o_id/rule/:id':'MainController.viewRule',
  'GET /org/:o_id/rule/:id/edit':'MainController.editRule',
  'POST /org/:o_id/rule/:id/edit':'MainController.editRule',
  'GET /org/:o_id/rule/:id/delete':'MainController.deleteRule',
  'POST /org/:o_id/rule/:id/delete':'MainController.deleteRule',

  'GET /org/:o_id/statements':'MainController.listStatements',
  'GET /org/:o_id/statement/create':'MainController.createStatement',
  'POST /org/:o_id/statement/create':'MainController.createStatement',
  'GET /org/:o_id/statement/:id':'MainController.viewStatement',
  'GET /org/:o_id/statement/:id/edit':'MainController.editStatement',
  'POST /org/:o_id/statement/:id/edit':'MainController.editStatement',
  'GET /org/:o_id/statement/:id/delete':'MainController.deleteStatement',
  'POST /org/:o_id/statement/:id/delete':'MainController.deleteStatement',
  

  'GET /org/:o_id/pnls':'MainController.listPnLs',
  'GET /org/:o_id/pnl/create':'MainController.createPnL',
  'POST /org/:o_id/pnl/create':'MainController.createPnL',
  'GET /org/:o_id/pnl/:id':'MainController.indexPnL',
  'GET /org/:o_id/pnl/:id/view':'MainController.viewPnL',
  'GET /org/:o_id/pnl/:id/edit':'MainController.editPnL',
  'POST /org/:o_id/pnl/:id/edit':'MainController.editPnL',
  'GET /org/:o_id/pnl/:id/delete':'MainController.deletePnL',
  'POST /org/:o_id/pnl/:id/delete':'MainController.deletePnL',
  'GET /org/:o_id/view_sample_pnl':'MainController.viewSamplePnL',


  'GET /org/:o_id/balance_sheets': 'MainController.listBalanceSheets',
  'GET /org/:o_id/balance_sheet/create': 'MainController.createBalanceSheet',
  'POST /org/:o_id/balance_sheet/create': 'MainController.createBalanceSheet',
  'GET /org/:o_id/balance_sheet/:id': 'MainController.viewBalanceSheet',
  'GET /org/:o_id/balance_sheet/:id/edit': 'MainController.editBalanceSheet',
  'POST /org/:o_id/balance_sheet/:id/edit': 'MainController.editBalanceSheet',
  'GET /org/:o_id/balance_sheet/:id/delete': 'MainController.deleteBalanceSheet',
  'POST /org/:o_id/balance_sheet/:id/delete': 'MainController.deleteBalanceSheet',


  'GET /orgs': 'MainController.listOrgs',
  'GET /org/create': 'MainController.createOrg',
  'POST /org/create': 'MainController.createOrg',
  'GET /org/:o_id': 'MainController.viewOrg',
  'GET /org/:o_id/edit': 'MainController.editOrg',
  'POST /org/:o_id/edit': 'MainController.editOrg',
  'GET /org/:o_id/delete': 'MainController.deleteOrg',
  'POST /org/:o_id/delete': 'MainController.deleteOrg',
  
  'GET /org/:o_id/members': 'MainController.listMembers',
  'GET /org/:o_id/member/create': 'MainController.createMember',
  'POST /org/:o_id/member/create': 'MainController.createMember',
  'GET /org/:o_id/member/:id': 'MainController.viewMember',
  'GET /org/:o_id/member/:id/edit': 'MainController.editMember',
  'POST /org/:o_id/member/:id/edit': 'MainController.editMember',
  'GET /org/:o_id/member/:id/delete': 'MainController.deleteMember',
  'DELETE /org/:o_id/member/:id': 'MainController.deleteMember',


  'GET /org/:o_id/dt/:id':'MainController.viewDoubtfulTransaction',
  'POST /org/:o_id/dt/:id/mark_as_unique':'MainController.markDTAsUnique', // api
  'POST /org/:o_id/dt/:id/mark_as_duplicate_of/:orig_txn_id':'MainController.markDTAsDuplicate', // api


  'GET /org/:o_id/rules':'MainController.listRules',
  'POST /org/:o_id/rule/create':'MainController.createRule',
  'GET /org/:o_id/rule/:id/edit':'MainController.editRule',
  'POST /org/:o_id/rule/:id/edit':'MainController.editRule',
  'GET /org/:o_id/rule/:id/delete':'MainController.deleteRule',
  'POST /org/:o_id/rule/:id/delete':'MainController.deleteRule',
  
  //org settings
  'GET /org/:o_id/settings': 'MainController.listSettings',

  // api patterns needs rewrite later
  'POST /org/:o_id/api/edit_desc':'MainController.editDescription',
  'POST /org/:o_id/api/edit_tags':'MainController.editTags',

  'GET /email_test':'MainController.emailTest',
  'GET /uam_test':'MainController.testUAM',

  'GET /login': 'AuthController.login',
  'POST /login': 'AuthController.login',
  'GET /signup': 'AuthController.signup',
  'POST /signup': 'AuthController.signup',
  'GET /logout': 'AuthController.logout',
  'GET /forgot': 'AuthController.view_forgot',
  'POST /forgot': 'AuthController.forgot',
  'GET /reset': 'AuthController.view_reset',
  'POST /reset': 'AuthController.reset',
  'GET /user/:id/edit': 'AuthController.editUser',
  'POST /user/:id/edit': 'AuthController.editUser',
  'POST /user/:id/generate_api_token': 'AuthController.generateAPIToken',

  'GET /user/:id/notifications': 'MainController.listNotifications',

  'GET /background/deepCrawl':'Background.deepCrawl',
  'POST /background/surface_crawl':'Background.surfaceCrawl',
  'GET /background/test':'Background.test',
  'POST /background/send_weekly_emails':'Background.sendWeeklyEmails',
  'POST /background/send_monthly_emails':'Background.sendMonthlyEmails',
  'POST /background/calculate_uam':'Background.calculateUAM',
  'POST /background/delete_tasks':'Background.deleteTasks',

  'GET /bull':'BullController.index',
  'GET /bull/restartQueueConnection':'BullController.restartQueueConnection',
  'GET /bull/:state':'BullController.listItems',
  'POST /bull/retry':'BullController.retryJob',
  'POST /bull/delete':'BullController.deleteJob',
	'POST /bull/repeat/delete':'BullController.deleteRepeatJob',

  'GET /testBull':'MainController.testBull',
  'GET /background/send_push_notification':'BackgroundController.sendPushNotification',



  'GET /curator/filter_test':'CuratorController.filterTest',
  'POST /curator/filter_test':'CuratorController.filterTest',



  'GET /user/:id/settings':'UserSettingsController.index',
  'GET /user/:id/settings/devices':'UserSettingsController.listDevices',
  'GET /user/:id/settings/device/create':'UserSettingsController.createDevice',
  'POST /user/:id/settings/device/create':'UserSettingsController.createDevice',
  'POST /background/ping_device':'BackgroundController.pingDevice',

  'GET /org/:o_id/intro':'IntroController.intro',
  'GET /org/:o_id/intro/create_account':'IntroController.createAccount',
  'GET /org/:o_id/intro/create_transaction':'IntroController.createTransaction',
  'GET /org/:o_id/intro/create_categories':'IntroController.createCategory',
  'GET /org/:o_id/intro/forward_email':'IntroController.forwardEmail',
  'GET /org/:o_id/intro/auto_forwarders':'IntroController.autoForwarders',
  'GET /org/:o_id/intro/auto_forwarders':'IntroController.autoForwarders',

  'GET /org/:o_id/mastery':'MasteryController.intro',
  'GET /org/:o_id/mastery/:level/:step':'MasteryController.viewStep',
  //webhooks

  'POST /webhook/docparser':'WebhookController.docparser',
  'POST /webhook/mailgun-inbound-parser': 'WebhookController.mailgunInboudParser',


  'GET /privacy': { view: 'privacy' },
  'GET /terms':{view:'terms'}
  /***************************************************************************
  *                                                                          *
  * Custom routes here...                                                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the custom routes above, it   *
  * is matched against Sails route blueprints. See `config/blueprints.js`    *
  * for configuration options and examples.                                  *
  *                                                                          *
  ***************************************************************************/

};
