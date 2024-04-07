const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    name: {
        type: String

    },
    email: {
        type: String

    },
    mobile: {
        type: Number

    },
    password: {
        type: String


    },
    is_admin: {
        type: Number,
        required: true
    },
    is_verified: {
        type: Number,
        default: false
    },
    is_blocked: {
        type: Boolean,
        default: false
    },
    referalId:{
        type:String,
        required:true
    },
    wallet:{
        type:Number, 
        required:true, 
        default:0
    },
    walletHistory:[{
        amount:{type:Number},
        description:{type:String},
        date:{type:Date},
        status:{type:String}
    }],
    referdId:{
        type:String,
        default:0
    }

})



module.exports = mongoose.model('users', userSchema)