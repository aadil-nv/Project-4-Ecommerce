const {ObjectId} = require('mongodb')
const mongoose=require('mongoose')

const cartSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    products :[
        {
            productId:{
                type:ObjectId,
                required:true,
                ref:'products'

            },
            quantity:{
                type:Number,
                default:1
            },
            price:{
                type:Number,
                default:0
            },
            totalPrice:{
                type: Number,
                default:0
            }
        }
    ]


})

module.exports=mongoose.model('Cart',cartSchema)




