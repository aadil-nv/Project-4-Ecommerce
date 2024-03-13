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

})



module.exports = mongoose.model('users', userSchema)