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
    }
})

module.exports=mongoose.model('categorys',categorySchema)