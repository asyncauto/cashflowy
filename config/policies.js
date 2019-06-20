/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.policies.html
 */


module.exports.policies = {

  /***************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions (`true` allows public     *
  * access)                                                                  *
  *                                                                          *
  ***************************************************************************/

  '*': false,
  
  MainController: {
    '*': ['isAuthenticated', 'isMemberOfOrg'],
    landingPage: true,
    listNotifications:['isAuthenticated'],
    createOrg: ['isAuthenticated']
  },
  IntroController: {
    '*': ['isAuthenticated', 'isMemberOfOrg'],
  },
  BullController: {
    '*': ['isAuthenticated', 'isAdmin']
  },
  UserSettingsController: {
    '*': ['isAuthenticated']
  },
  BackgroundController: {
    '*': ['isBackground'],
    'sendPushNotification':true,
    'pingDevice':['isAuthenticated'],
  },
  CuratorController: {
    '*': ['isAuthenticated', 'isAdmin']
  },
  WebhookController: {
    '*': true
  },
  AuthController: {
    '*': ['rateLimit'],
    'editUser': ['isAuthenticated'],
    'generateAPIToken': ['isAuthenticated']
  },
  TransactionController: {
    '*': ['isAuthenticated', 'isMemberOfOrg', 'isBlueprint'],
    'destroy': false
  },
  CategoryController: {
    '*': ['isAuthenticated', 'isMemberOfOrg', 'isBlueprint'],
    'destroy': false
  },
  TagController: {
    '*': ['isAuthenticated', 'isMemberOfOrg', 'isBlueprint'],
    'destroy': false
  },
  SnapshotController: {
    '*': ['isAuthenticated', 'isMemberOfOrg', 'isBlueprint'],
    'destroy': false
  },
  AccountController: {
    '*': ['isAuthenticated', 'isMemberOfOrg', 'isBlueprint'],
    'destroy': false
  }
};
