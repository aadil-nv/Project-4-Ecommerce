const mongoose=require('mongoose')
const { ObjectId } = require('mongodb');
const productSchema = new mongoose.Schema({
    productname: {
        type:String
    },
    productprice: {
        type:Number
    },
    productquadity: {
        type:Number
    },
    productimage: {
        type:Array
    },
    categoryId: {
        // type:mongoose.Schema.Types.ObjectId,
        // ref:"category"
        type:String
    },
    productdescription:{
        type:String
    },
    isListed: {
        type:Boolean,
        default:true
    },
    offerId :{
        type:mongoose.Schema.Types.ObjectId,
        ref:"offer", 
    },
    brand:{
        type:String
    }

})

module.exports=mongoose.model('products',productSchema)