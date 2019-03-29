/**
 * Invoice.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
module.exports = {
    attributes: {
        name: {
            type: 'string',
        },
        description: { // some description about the organization
            type: 'string',
            allowNull:true
        },
        type: {
            type: 'string',
            isIn:['personal','business']
        },
        is_active:{
            type: 'boolean',
            defaultsTo: true
        },
        owner:{ // 
            model:'user',
            required:true
        },
        members: { // 
            collection: 'member',
            via:'org',
        },
        details: {
            type: 'json',
            defaultsTo: {
                settings:{}, // org settings
            }
        },
    },
    afterCreate: function (org, cb) {
        Member.create({
            user:org.owner,
            type:'admin',
            org:org.id,
        }).exec(cb);
    }
}