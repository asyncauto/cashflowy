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
  'GET /dashboard':'MainController.dashboard',
  'GET /debug':'MainController.debug',
  
  
  'GET /emails':'MainController.listEmails',
  'GET /email/create':'MainController.createEmail',
  'POST /email/create':'MainController.createEmail',
  'GET /email/:id/edit':'MainController.editEmail',
  'POST /email/:id/edit':'MainController.editEmail',
  'GET /email/:id':'MainController.viewEmail',
  
  'GET /accounts':'MainController.listAccounts',
  'GET /account/create':'MainController.createAccount',
  'POST /account/create':'MainController.createAccount',

  
  'GET /transactions':'MainController.listTransactions',
  'GET /transaction/create':'MainController.createTransaction',
  'POST /transaction/create':'MainController.createTransaction',


  'GET /snapshots':'MainController.listSnapshots',
  'GET /snapshot/create':'MainController.createSnapshot',
  'POST /snapshot/create':'MainController.createSnapshot',


  'GET /categories':'MainController.listCategories',
  'GET /category/create':'MainController.createCategory',
  'POST /category/create':'MainController.createCategory',
  'GET /category/:id':'MainController.viewCategory',

  // api patterns needs rewrite later
  'POST /api/edit_desc':'MainController.editDescription',



  'GET /login': 'AuthController.login',
  'POST /login': 'AuthController.login',
  'GET /signup': 'AuthController.signup',
  'POST /signup': 'AuthController.signup',
  'GET /logout': 'AuthController.logout',
  





  'GET /background/deepCrawl':'Background.deepCrawl',
  'POST /background/surface_crawl':'Background.surfaceCrawl',
  'GET /background/test':'Background.test',



  'GET /kue':'KueController.index',
  'GET /kue/:state':'KueController.listItemsInKue',
  'POST /kue/retry':'KueController.retryJob',
  'POST /kue/delete':'KueController.deleteJob',



  'GET /curator/filter_test':'CuratorController.filterTest',
  'POST /curator/filter_test':'CuratorController.filterTest',

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
