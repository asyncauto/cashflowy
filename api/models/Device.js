/**
 * Device.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
module.exports = {
    // tableName:'loan',
    attributes: {
        name:{
            type:'string',
        },
        is_enabled:{
            type:'boolean',
            defaultsTo:true
        },
        user:{
            model:'user',
            required:true
        },
        push_subscription:{
            type:'json',
            required:true
        },
        details:{
            type:'json',
            defaultsTo:{}
        },
    },
}