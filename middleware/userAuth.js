
const User = require("../models/userModel");
const Products = require("../models/productModel");


const isLogin = async (req, res, next) => {
    try {
         if (req.session.user) {
            res.locals.customer=true
           next()
        }
        else {         
               res.locals.customer=false

               const ProductData = await Products.find();
               res.render("user/index", { ProductData });
        }

    } catch (erorr) {
        console.log(erorr.message)
    }
}

const isLogout = async (req, res, next) => {
    try {
         if (!req.session.user) {
            
             next()
        } else {
            res.redirect('/')
        }

    } catch (erorr) {
        console.log(erorr.message)
    }
}

module.exports = {
    isLogin,
    isLogout
}