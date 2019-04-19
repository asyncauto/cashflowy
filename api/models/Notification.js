/**
 * Notification.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    body: {
      type: 'string',
      required: true
    },
    type: {
      type: "string",
      required: true
    },
    details: {
      type: 'json',
      columnType: 'jsonb',
      defaultsTo: {},
    },
    read_status: {
      type: 'boolean',
      defaultsTo: false
    },
    navigate_uri: {
      type: 'string'
    },
    user: {
      model: 'user',
      required: true
    },
    org: {
      model: 'org',
    }
  },

  afterCreate: async function (notification, cb) {
    var user = await User.findOne(notification.user);
    if (user.details.notifications)
      user.details.notifications.unseen_count += 1;

    user.details.notifications = {};
    user.details.notifications.last_seen_noti_time = '2017-01-01T00:00:00.000Z';
    user.details.notifications.unseen_count = 1;
    user.details.notifications.seen_count = 0;

    await User.update({ id: user.id }, { details: user.details });

    return cb();
  }

};

