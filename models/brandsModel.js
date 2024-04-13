const mongoose=require('mongoose')

const brandsSchema=new mongoose.Schema({

    brandname : {
        type:String
    },
    brandItems: {
        type:Number
    },
    barndStatus : {
        type:Boolean,
        default: true
    }
})

module.exports=mongoose.model('brands',brandsSchema)