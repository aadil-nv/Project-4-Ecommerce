const mongoose=require('mongoose')

const categorySchema=new mongoose.Schema({

    categoryname : {
        type:String
    },
    categorydescription: {
        type:String
    },
    categorystatus : {
        type:Boolean,
        default:false
    },
    offerId :{
        type:mongoose.Types.ObjectId,
        ref:"offer", 
    }
})

module.exports=mongoose.model('categorys',categorySchema)