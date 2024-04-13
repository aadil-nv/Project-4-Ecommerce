const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");



const orderSchema= new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users',
        required:true
    },
    orderId:{
        type:String,
        required:true
    },
    cartId:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:'Cart',
        required:true
    },
    orderedItem:[{
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'products',
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        productStatus:{
            type: String,
            default:"pending",
            required: true
        },
        totalProductAmount:{
            type:Number,
            required:true
        },
        returnRequest:{
            type:Boolean,
            default:false
        },
        returnReason:{
            type:String,
            
        }

        
    }],
    couponDeduction :{
        type:Number,
        required:true,
        default :0
    },
    orderAmount: {
        type: Number,
        required: true,

    },
    deliveryAddress: {
        type: Object,
        required: true,
    },
    paymentStatus: {
        type: String,
        required: true,
        default:"pending"
    },
    deliveryDate:{
        type:Date
    },
    shippingDate:{
        type:Date
    },
    paymentMethod: {
        type: String,
        required: true,
        date:Date.now
   
    }
    
})

module.exports=mongoose.model('order',orderSchema)