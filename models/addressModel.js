    const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

// Define schema for address
const addressSchema = new mongoose.Schema({
    name: {
        type: String,
        
    },
    mobile: {
        type: Number, 
       
    },
    pincode: {
        type: Number, 
      
    },
    address: {
        type: String,
       
    },
    streetaddress: {
        type: String,
      
    },
    city: {
        type: String,
      
    },
    state: {
        type: String,
       
    },
    landmark :{
     type : String,
  
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    

    },
    status:{
        type:Boolean,
     
        default:false
        }
    
});



module.exports=mongoose.model('address',addressSchema)

