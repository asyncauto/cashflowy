/**
 * Invoice.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
module.exports = {
    attributes: {
        type: {
            type: 'string',
            isIn: ['admin', 'contributor','guest'], // guest has only read access. Contributor has write access and admin has permission to add new users
        },
        user:{
            model:'user',
            required:true
        },
        org: {
            model: 'org',
            required: true
        },
    },
}