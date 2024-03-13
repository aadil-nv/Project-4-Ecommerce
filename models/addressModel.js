const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

// Define schema for address
const addressSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String, 
        required: true
    },
    pincode: {
        type: Number, 
        required: true
    },
    address: {
        type: String,
        required: true
    },
    streetaddress: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    landmark :{
     type : String,
     required: true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true

    }
    
});



module.exports=mongoose.model('address',addressSchema)

