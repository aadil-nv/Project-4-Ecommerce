const User = require("../models/userModel");
const Otp = require("../models/otp");
const bcrypt = require("bcrypt");
const session = require("express-session");
const nodemailer = require("nodemailer");
const path = require("path");
const { log } = require("console");
const Products = require("../models/productModel");
const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const order = require("../models/orderModal");
const Wishlist = require("../models/wishlistModel");
const Coupon = require("../models/couponModal");
const Offer = require("../models/offerModal");
const Category = require("../models/categoryModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const toastr= require('toastr')
require("dotenv").config();
var {
  validatePaymentVerification,
} = require("razorpay/dist/utils/razorpay-utils");


// -----------------------------generating referal Code-----------------------------------------

function generateReferralCode(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const codeLength = length || 7;
  let referralCode = '';

  for (let i = 0; i < codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      referralCode += characters[randomIndex];
  }

  return referralCode;
}





// -----------------------------End generating referal Code-----------------------------------------

// --------------OTP Generating-----------------
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000);
};
// ------------------------------End------------------------------------

let userData;

// -------------Bcrypting password----------------
const securedPassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (erorr) {
    console.log(erorr.message);
  }
};
// ------------------------------End------------------------------------

// -------------Loading Registrationpage-----------
const loadRegister = async (req, res) => {
  try {
    res.render("user/registration");
  } catch (erorr) {
    console.log(erorr.message);
  }
};
// ------------------------------End------------------------------------

// ----------------Root Page-----------------------

const home = async (req, res) => {
  try {
    const user=req.session.user
    const ProductData = await Products.find().populate("offerId");
    const cartData = await Cart.find({ userId: user });

    // Calculate total count of products in all carts
    let productcount = 0;
    for (const cart of cartData) {
      productcount += cart.products.length;
    }

    res.render("user/index", { ProductData, productcount});
  } catch (erorr) {
    console.log(erorr.message);
  }
};
// ------------------------------End------------------------------------

// -------------User Inserting Data in signup page----------------

const insertUser = async (req, res) => {
  try {
    const referalId=generateReferralCode(7)

    const checkemail = await User.findOne({ email: req.body.email });
    if (checkemail) {
      return res.render("user/registration", {
        message: "Email already exist",
      });
    }

    const spassword = await securedPassword(req.body.password);

    const email = req.body.email;
    const emailRegex = /^[A-Za-z0-9.%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      res.render("user/registration", { message: "Invalid Email Provided" });
    }

    const name = req.body.name;
    const nameRegex = /^[a-zA-Z]+(?: [a-zA-Z]+)*$/;

    if (!nameRegex.test(name.trim())) {
      res.render("user/registration", { message: "Invalid Name Provided" });
    }

    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(req.body.mno)) {
      return res.render("user/registration", {
        message: "Invalid Mobile Number Povided",
      });
    }

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mno,
      password: spassword,
      is_admin: 0,
      is_blocked: false,
      referalId:referalId,
      wallet:0,
      walletHistory:[],
      referdId:req.body.referdid
    });

    userData = user;

    if (userData) {
      const otp = generateOTP();

      const userotp = new Otp({
        otp: otp,
        email: req.body.email,
      });
      await userotp.save();

      verifyEmail(name, email, otp);

      return res.render("user/otp");
    } else {
      res.render("registration", {
        message: "Your Registration has been Failed ",
      });
    }
  } catch (erorr) {
    console.log(erorr.message);
  }
};
// ------------------------------End------------------------------------

// ----------------Nodemailer OTP send--------------------

const verifyEmail = async (name, email, otp) => {
  try {
    const transport = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: "adilev2000@gmail.com",
        pass: "zufu zbyh zeac zptj",
      },
    });
    const mailoption = {
      from: "adilev2000@gmail.com",
      to: email,
      subject: "for verification mail",
      html: `<h1>hi ${name} this is OTP form Ecommerce-Furniture <a>${otp}</a></h1>`,
    };
    transport.sendMail(mailoption, (err, info) => {
      if (err) {
        console.log(err.message);
      } else {
        console.log(`Email has been sent: ${info.messageId}`);
        console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};
// ------------------------------End------------------------------------

// ------------------OTP validation--------------------------------

const otpLogin = async (req, res) => {
  try {
    const storedEmail = await Otp.findOne({ Otps: req.body.otp }).sort({createdAt: -1,});
    
    const storedOtp = storedEmail.otp;
    const { n1, n2, n3, n4 } = req.body;
    const userOtp = `${n1}${n2}${n3}${n4}`;

    if (storedOtp == userOtp) {
      await userData.save();


      const referdId= userData.referdId
      if (referdId) {
      
        const referringUser = await User.findOne({ referalId: referdId });
        if (referringUser) {
         
          referringUser.wallet += 500;
          referringUser.walletHistory.push({
            amount: 500,
            description: "Referral bonus",
            date: new Date(),
            status: "credit"
          });
          await referringUser.save();
        }
      }
      
      
      await User.findOneAndUpdate(
        { email: userData.email },
        { is_verified: true }
      );
      return res.render("user/login", {
        message: "Successfull Registerd Now Login",
      });
    } else {
      return res.render("user/otp", { message: "wrong Otp" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
// ------------------------------End------------------------------------

// ----------------Loading login page --------------------------------

const loadLogin = async (req, res) => {
  try {
    res.render("user/login");
  } catch (erorr) {
    console.log(erorr.message);
  }
};
// ------------------------------End------------------------------------

// -------------User Login validaing and entering with userdata --------------------------------------

const userLogin = async (req, res) => {
  try {
    const userData = await User.findOne({ email: req.body.email });

    if (!userData) {
      res.render("user/login", { message: "Not a user" });
    }

    const block = userData.is_blocked;

    const ProductData = await Products.find();

    if (userData) {
      const passwordMatch = await bcrypt.compare(
        req.body.password,
        userData.password
      );

      if (passwordMatch && !block) {
        req.session.user = userData._id;
        res.redirect("/");
      } else if (block) {
        res.render("user/login", { message: "Your Account has been blocked" });
      } else {
        res.render("user/login", { message: "Incorrect Mail and Password" });
      }
    } else {
      res.render("user/login", { message: "Your Account has been blocked" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// -------------------------------------------End---------------------------------------------

// -------------------------------------------Loading User Profile-------------------------------------------

const loadUserProfile = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.user })
    const addressData = await Address.find({ userId: req.session.user }).sort({_id:-1});
    const orderData = await order
      .find({ userId: req.session.user })
      .populate("orderedItem.productId").sort({_id:-1})
    const couponData = await Coupon.find().sort({_id:-1})
    const user=req.session.user
    const cartData = await Cart.find({ userId: user });

    // Calculate total count of products in all carts
    let productcount = 0;
    for (const cart of cartData) {
      productcount += cart.products.length;
    }
    let added = req.query.msg;

    if (User) {
      userData.walletHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
      const message = req.flash("succ");
      if (added) {
        return res.render("user/userprofile", {
          userData,
          addressData,
          message,
          added,
          orderData,
          couponData,
          productcount
        });
      } else {
        return res.render("user/userprofile", {
          userData,
          addressData,
          message,
          orderData,
          couponData,
          productcount
        });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};
// ------------------------------End Loading UserProfile------------------------------------

const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        cosole.log("session is not destroyed");
      } else {
        res.redirect("/");
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

// -----------------Resending the OTP-------------------------------

const resendOtp = async (req, res) => {
  try {
    const newotp = generateOTP();

    verifyEmail(userData.name, userData.email, newotp);
    await Otp.updateOne({ email: userData.email }, { otp: newotp });

    res.render("user/otp");
  } catch (error) {
    console.log(error.message);
  }
};
// ------------------------------End------------------------------------

// -------------------Back to userHome with UsererData--------------------------------
const backToUserHome = async (req, res) => {
  try {
    const user=req.session.user
    const ProductData = await Products.find().populate('offerId')
    const cartData = await Cart.find({ userId: user });

    // Calculate total count of products in all carts
    let productcount = 0;
    for (const cart of cartData) {
      productcount += cart.products.length;
    }

    res.render("user/index", { ProductData, User: req.session.user ,productcount});
  } catch (error) {
    console.log(error.message);
  }
};
// ----------------------------------------------End--------------------------------------------

// ----------------------------------------------Loading ShopPage-------------------------------------------


const loadShopPage= async(req, res)=> {
  try {
    const productsPerPage = 12;
    const user=req.session.user
    const cartData = await Cart.find({ userId: user });
    let currentPage = parseInt(req.query.page) || 1;

    const totalProducts = await Products.countDocuments();


    const totalPages = Math.ceil(totalProducts / productsPerPage);
    const categoryData = await Category.find()

    if (currentPage < 1) {
        currentPage = 1;
    } else if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = Math.min(startIndex + productsPerPage, totalProducts);

    let productcount = 0;
    for (const cart of cartData) {
      productcount += cart.products.length;
    }

    const productData = await Products.find().populate("offerId").skip(startIndex).limit(productsPerPage);

   
    res.render("user/shop", { User, productData, categoryData, currentPage, totalPages ,productcount});
} catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
}
}



// ----------------------------------------------End--------------------------------------------

// ----------------------------------------------Loading AboutPage-------------------------------------------

const loadAboutPage = async (req, res) => {
  try {
    const user=req.session.user
    const cartData = await Cart.find({ userId: user });

    
    let productcount = 0;
    for (const cart of cartData) {
      productcount += cart.products.length;
    }
    res.render("user/about", { User ,productcount});
  } catch (error) {
    console.log(error.message);
  }
};

// ----------------------------------------------Ending AboutPage-------------------------------------------

// ----------------------------------------------Loading ShopPage-------------------------------------------
const loadContactPage = async (req, res) => {
  try {
    const user=req.session.user
    const cartData = await Cart.find({ userId: user });

    let productcount = 0;
    for (const cart of cartData) {
      productcount += cart.products.length;
    }
    res.render("user/contact", { User ,productcount});
  } catch (error) {
    console.log(error.message);
  }
};

// ----------------------------------------------End ShopPage-------------------------------------------

// ----------------------------------------------Loading Product Tab-------------------------------------------

const loadProductTab = async (req, res) => {
  try {
    const productId = req.params.id;
    const user=req.session.user
    const cartData = await Cart.find({ userId: user });

    
    let productcount = 0;
    for (const cart of cartData) {
      productcount += cart.products.length;
    }
    const savedData = await Products.findById(productId).populate("offerId");

    if (savedData) {
      return res.render("user/producttab", { savedData: savedData ,productcount});
    }
    res.redirect("index");
  } catch (error) {
    console.log(error.message);
  }
};

// ----------------------------------------------End Product Tab-------------------------------------------

// ----------------------------------------------Loding Google Auth-------------------------------------------

const loadGoogleAuth = async (req, res) => {
  try {
    const ProductData = await Products.find();
    const gUser = req.user;
    
    if (gUser) {
      req.session.user = gUser._id;
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};
// ----------------------------------------------Ending  Google Auth-------------------------------------------

// ----------------------------------------------Loding view Cart-------------------------------------------



const loadViewCart = async (req, res) => {
  try {
    const user = req.session.user;

    const cartDetiles = await Cart.find({ userId: user }).populate("products.productId").populate({path:'products.productId',populate:{path:"offerId",model:"offer"}})
    let total = 0;

   let productcount=0

    for (const cart of cartDetiles) {
      for (const item of cart.products) {
        const product = item.productId;

        let totalPrice = product.productprice * item.quantity;

      
        if (product.offerId) {
          const offer = await Offer.findById(product.offerId);
          if (offer && offer.status === "active") {
            const discountedPrice = totalPrice * (1 - offer.percentage / 100);
            totalPrice = discountedPrice;
          }
        }

        item.totalPrice = totalPrice;
        total += totalPrice;
        productcount++
      }
    }
    
 

    res.render("user/cart", { cartDetiles, total ,productcount});
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};







const editUseprofile = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.user });
    res.render("user/edituserdetiles", { userData });
  } catch (error) {
    console.log(error.message);
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const newId = req.params.id;

    const userData = await User.findOne({ _id: newId });

    if (req.body.username) {
      await User.findByIdAndUpdate({ _id: newId }, { name: req.body.username });
    }
    if (req.body.usermobile) {
      await User.findByIdAndUpdate(
        { _id: newId },
        { mobile: req.body.usermobile }
      );
    }
    res.json({ already: "Upadated Succefully " });
  } catch (error) {
    console.log(error.message);
  }
};

// ----------------------------------------------Ending Editing User Dateiles-------------------------------------------

// ----------------------------------------------Upadete User Passoword  -------------------------------------------

const updateUserPassword = async (req, res) => {
  try {
    const passId = req.params.id;
    const oldPass = req.body.oldpassword;
    const newPass = req.body.newpassword;

    const newPassData = await User.findOne({ _id: passId });
    if (newPassData) {
      const passwordMatch = await bcrypt.compare(
        req.body.oldpassword,
        newPassData.password
      );
      const newSpassword = await securedPassword(req.body.newpassword);

      if (!passwordMatch) {
        res.json({ already: "Please check your Password" });
      } else {
        await User.findByIdAndUpdate(
          { _id: passId },
          { password: newSpassword }
        );
        res.json({ already: "Password changed SuccesFully" });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};
// ----------------------------------------------Ending Updte UserPassword-------------------------------------------
// ----------------------------------------------Loading  Address page-------------------------------------------

const loadAddressPage = async (req, res) => {
  try {
    const user=req.session.user
    const cartData = await Cart.find({ userId: user });

    
    let productcount = 0;
    for (const cart of cartData) {
      productcount += cart.products.length;
    }
    
    res.render("user/address",{productcount});
  } catch (error) {
    console.log(error.message);
  }
};

// ----------------------------------------------Ending Address page-------------------------------------------

// ---------------------------------------------- add User Address-------------------------------------------

const addUserAddress = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.user });

    if (userData) {
      const newAddress = new Address({
        name: req.body.username,
        mobile: req.body.usermobile,
        pincode: req.body.pincode,
        address: req.body.address,
        streetaddress: req.body.streetaddress,
        city: req.body.city,
        state: req.body.state,
        landmark: req.body.landmark,
        userId: req.session.user,
        status: false,
      });
      await newAddress.save();
      const message = "New address addedd Succesfully";
      req.flash("succ", message);
      return res.redirect("/userprofile");
    }
  } catch (error) {
    console.log(error.message);
  }
};
// ---------------------------------------------- Endingadd User Address-------------------------------------------

// ---------------------------------------------- Load edit Address-------------------------------------------

const loadEditUser = async (req, res) => {
  try {
    const addressId = req.params.id;

    const addressData = await Address.findOne({ _id: addressId });
    const user=req.session.user
    const cartData = await Cart.find({ userId: user });

    
    let productcount = 0;
    for (const cart of cartData) {
      productcount += cart.products.length;
    }
    

    res.render("user/editaddress", { addressData,productcount });
  } catch (error) {
    console.log(error.message);
  }
};

// ---------------------------------------------- End edit Address-------------------------------------------

// ----------------------------------------------  Upate user Address-------------------------------------------

const updateUserAddress = async (req, res) => {
  try {
    const updateId = req.params.id;

    const aData = await Address.findByIdAndUpdate(
      { _id: updateId },
      {
        name: req.body.username,
        mobile: req.body.usermobile,
        pincode: req.body.pincode,
        address: req.body.address,
        streetaddress: req.body.streetaddress,
        city: req.body.city,
        state: req.body.state,
        landmark: req.body.landmark,
        status: false,
      }
    );

    res.json({ already: "Address changed SuccesFully" });
  } catch (error) {
    console.log(error.message);
  }
};
// ---------------------------------------------- End Updtae User Address-------------------------------------------

// ---------------------------------------------- Delte User Address-------------------------------------------

const deleteUseraddress = async (req, res) => {
  try {
    const dltId = req.params.id;

    const deleteData = await Address.findByIdAndDelete({ _id: dltId });

    res.status(200).json({ message: "deletion successfull" });
  } catch (error) {
    console.log(error.message);
  }
};

// ---------------------------------------------- End Delte User Address-------------------------------------------

// ----------------------------------------------addProductInCart -------------------------------------------

const addProductInCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user;

    const existingProduct = await Cart.findOne({userId: userId,"products.productId": productId,});
    const productData2 = await Products.findById(productId).populate("offerId");

    if (productData2.productquadity === 0) {
      return res.status(400).json({ message: "Product is out of stock" });
    }

    if (existingProduct) {
      return res.status(400).json({ message: "Product already in cart" });
    }

    const productData = await Products.findById(productId).populate("offerId")
    let totalPrice = productData.productprice;
    
    if (productData.offerId) {
      const offerPercentage = productData.offerId.percentage;
      totalPrice = totalPrice * (100 - offerPercentage) / 100;
    }
    
    const add = await Cart.findOneAndUpdate(
      { userId: req.session.user },
      {$addToSet: {products: {productId: productId,quantity: 1,totalPrice: totalPrice,},},
      $inc: { total: totalPrice },
      },
      { new: true, upsert: true });


    res.status(200).json({ message: "Product added to cart successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ---------------------------------------------- End addProductInCart-------------------------------------------

// ---------------------------------------------- Increasing decresing quantity -------------------------------------------




const quantityControll = async (req, res) => {
  try {
    const { change, qty } = req.body;
   
    const user = req.session.user;
    const product = await Products.findOne({ _id: change }).populate('offerId');
    
    const productQuantity = product.productquadity;
   

    let total = qty * product.productprice;

   
    if (product.offerId) {
      const productOffer = product.offerId.percentage;
      total = total * (100 - productOffer) / 100;
    }


    if (qty > productQuantity) {
      return res.json({ message: "Out of Stock" });
    }

 
    await Cart.findOneAndUpdate(
      { userId: req.session.user, "products.productId": change },
      { $set: { "products.$.quantity": qty, "products.$.totalPrice": total } },
      { new: true }
    );

    
    const cartDetiles = await Cart.find({ userId: user }).populate("products.productId").populate({path:'products.productId',populate:{path:"offerId",model:"offer"}})
    
    let totalAmount = 0;
    cartDetiles.forEach((item) => {
      item.products.forEach((product) => {
        let productTotal = product.quantity * product.productId.productprice;
       
        if (product.productId.offerId) {
          const productOffer = product.productId.offerId.percentage;
          productTotal = productTotal * (100 - productOffer) / 100;
        }
        totalAmount += productTotal;
      });
    });

    await Cart.findOneAndUpdate(
      { userId: user },
      { $set: { total: totalAmount } },
      { new: true }
    );

    res.json({ totalAmount, productQuantity });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};





// ---------------------------------------------- End Increasing decresing quantity -------------------------------------------

// ---------------------------------------------- Delte cartProduct -------------------------------------------

const deleteCartProduct = async (req, res) => {
  try {
    const deleteId = req.params.id;
    const userId = req.session.user;
    const cart = await Cart.findOne({ userId: userId });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    let totalPriceToRemove = 0;

    for (const product of cart.products) {
      if (product.productId.toString() === deleteId) {
        totalPriceToRemove = product.totalPrice;
        break;
      }
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { userId: userId },
      { $pull: { products: { productId: deleteId } },
        $inc: { total: -totalPriceToRemove }
     },
      { new: true }
    );

    if (!updatedCart) {
      return res.status(404).json({ error: "Cart not found" });
    }
    res.status(200).json({ message: "deletion successfull" });

  } catch (error) {
    console.log(error.message);
  }
};
// ---------------------------------------------- End Delete CartProduct -------------------------------------------

// ---------------------------------------------- Load Checkout Page -------------------------------------------



const loadtCheckoutPage = async (req, res) => {
  try {
    const userId = req.session.user;

    const addressData = await Address.find({ userId: userId });
    const cartDetiles = await Cart.find({ userId: userId }).populate("products.productId").populate({path:'products.productId',populate:{path:"offerId",model:"offer"}});

    let total = 0;

    for (const cart of cartDetiles) {
      for (const item of cart.products) {
        let productTotal = item.quantity * item.productId.productprice;

        if (item.productId.offerId) {
          const offerPercentage = item.productId.offerId.percentage;
          const discountedPrice = productTotal * (100 - offerPercentage) / 100;
          productTotal = discountedPrice;
        }

        total += productTotal;
      }
    }

    const user=req.session.user
    const cartData = await Cart.find({ userId: user });

    
    let productcount = 0;
    for (const cart of cartData) {
      productcount += cart.products.length;
    }

    res.render("user/checkout", { addressData, cartDetiles, total,productcount });
  } catch (error) {
    console.error(error.message);
  }
};


// ---------------------------------------------- End Load checkoot Page -------------------------------------------

const editUseraddressInCheckout = async (req, res) => {
  try {
    const editCheckId = req.params.id;
    const userId = req.session.user;
    const addressDataSecond = await Address.findOne({ _id: editCheckId });

    res.json({ addressDataSecond });
  } catch (error) {
    console.log(error.message);
  }
};

const updatecartAddress = async (req, res) => {
  try {
    const {
      addressId,
      username,
      usermobile,
      address,
      streetaddress,
      pincode,
      state,
      landmark,
      city,
    } = req.body;

    const aData = await Address.findByIdAndUpdate(
      { _id: addressId },
      {
        name: username,
        mobile: usermobile,
        pincode: pincode,
        address: address,
        streetaddress: streetaddress,
        city: city,
        state: state,
        landmark: landmark,
        status: false,
      }
    );
    res.json({ message: "successfully" });
  } catch (error) {
    console.log(error.message);
  }
};

const addCheckoutAddress = async (req, res) => {
  try {
    const userData = await User.findOne({ _id: req.session.user });

    if (userData) {
      const newAddress = new Address({
        name: req.body.username,
        mobile: req.body.usermobile,
        pincode: req.body.pincode,
        address: req.body.address,
        streetaddress: req.body.streetaddress,
        city: req.body.city,
        state: req.body.state,
        landmark: req.body.landmark,
        userId: req.session.user,
        status: false,
      });
      await newAddress.save();
      const message = "New address addedd Succesfully";
      req.flash("succ", message);
      return res.redirect("/checkoutpage");
    }
  } catch (error) {
    console.log(error.message);
  }
};


const placeOrder = async (req, res) => {
  try {
    const { activeAddressId, paymentmethod, totalDiscount, couponCode } = req.body;

    const generateRandomOrderId = (length) => {
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      for (let i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      return result;
    };

    const userId = req.session.user;
   
    const cartData = await Cart.findOne({ userId }).populate("products.productId");

    const currentAddress = await Address.findById(activeAddressId);

    const orderedItems = cartData.products.map((product) => {
      const totalProductAmount =product.quantity * (product.productId?.price || 0);
      return {
        productId: product.productId,
        quantity: product.quantity,
        productStatus: "pending",
        totalProductAmount: product.totalPrice,
      };
    });

    const orderAmount = orderedItems.reduce(
      (total, item) => total + item.totalProductAmount,0);

    const orderId = "order_" + generateRandomOrderId(9);

    let newOrder = new order({
      userId,
      cartId: cartData._id,
      orderId,
      orderedItem: orderedItems,
      orderAmount: totalDiscount,
      deliveryAddress: currentAddress,
      paymentStatus: "pending",
      deliveryDate: new Date(),
      shippingDate: new Date(),
      paymentMethod: paymentmethod,
    });

    req.session.newOrders = newOrder;

    if (paymentmethod === "RazorPay") {
      const options = {
        amount: totalDiscount * 100,
        currency: "INR",
        receipt: crypto.randomBytes(10).toString("hex"),
      };

      const razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_ID_KEY ,
        key_secret: process.env.RAZORPAY_SECRET_ID,
      });

      razorpayInstance.orders.create(options,(err, order) => {
          if (err) {
            console.log("founded---------",err);
            res.json({ success: false });
          } else {
            res.json({
              order: order,
              success: true,  
              order_id: order.id,
              key_id: "rzp_test_nexg64Tm176iuH",
              paymentMethod: paymentmethod,
              couponCode: couponCode
            });
          }
        });

    } else if(paymentmethod === "Cash On Delivery") {

      if(totalDiscount>1000){
        return res.json({message:"failed"})
      }
      await newOrder.save();

      for (const item of orderedItems) {
        const productId = item.productId;
        const quantity = item.quantity;

        await Products.findOneAndUpdate(
          { _id: productId },
          { $inc: { productquadity: -quantity } });}

      if (couponCode) {
        
        const couponData = await Coupon.findOneAndUpdate(
          { couponCode: couponCode },
          { $push: { usedUser: { userId: req.session.user, used: true } } },
          { new: true }
        )
        const couponDeduction = await Coupon.findOne({ couponCode: couponCode })
        const discountAmount1 = couponDeduction.discountAmount
        await order.findOneAndUpdate(
          { _id: newOrder._id },
          { $set: { couponDeduction: discountAmount1 } }, { new: true })

      }


      await Cart.deleteOne({ userId: req.session.user });
      res.json({ newOrder, paymentmethod });

    }else if(paymentmethod === "Wallet"){

      const WalletUserData= await User.findById({_id:userId})
      const walletMoney=WalletUserData.wallet

      if(walletMoney <= totalDiscount ){
        console.log("Wallet Payment failed InsuficiantFund")
        return res.json({message:"Failed"})
        
      }else{

        let walletNewOrder = new order({
          userId,
          cartId: cartData._id,
          orderId,
          orderedItem: orderedItems,
          orderAmount: totalDiscount,
          deliveryAddress: currentAddress,
          paymentStatus: "Payment Successfull",
          deliveryDate: new Date(),
          shippingDate: new Date(),
          paymentMethod: paymentmethod,
        });

          await walletNewOrder.save()

          for (const item of orderedItems) {
            const productId = item.productId;
            const quantity = item.quantity;
    
            await Products.findOneAndUpdate(
              { _id: productId },
              { $inc: { productquadity: -quantity } });}

              if (couponCode) {
        
                const couponData = await Coupon.findOneAndUpdate(
                  { couponCode: couponCode },
                  { $push: { usedUser: { userId: req.session.user, used: true } } },
                  { new: true }
                )
                const couponDeduction = await Coupon.findOne({ couponCode: couponCode })
                const discountAmount1 = couponDeduction.discountAmount
                await order.findOneAndUpdate(
                  { _id: walletNewOrder._id },
                  { $set: { couponDeduction: discountAmount1 } }, { new: true })
              }

              const userData= await User.findById({_id:userId})
              const walletMoney= userData.wallet
              const balanceWallet=walletMoney-totalDiscount
              

              const updatedUser = await User.findByIdAndUpdate(userId, {
                $set: { wallet: balanceWallet }, 
                $push: {
                    walletHistory: {
                        amount: balanceWallet,
                        description: `Refund of ORDERID:${walletNewOrder._id}`,
                        date: new Date(),
                        status: "Debit"
                    }
                }
                }, { new: true });


              await Cart.deleteOne({ userId: req.session.user });
             console.log("Wallet Payment successfulll")
        return res.json({walletNewOrder,paymentmethod})
      }
    }

  } catch (error) {
    console.log("errror : ", error);
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
};

const loadOrderPage = async (req, res) => {
  try {
    const orderId = req.params.id;

    const orderData = await order
      .find({ _id: orderId })
      .populate("orderedItem.productId")
      .populate("deliveryAddress")
      .populate("userId")

      const user=req.session.user
    const cartData = await Cart.find({ userId: user });

    
    let productcount = 0;
    for (const cart of cartData) {
      productcount += cart.products.length;
    }

    res.render("user/orders", { orderData,productcount });
  } catch (error) {
    console.log(error.message);
  }
};



const orderCancel = async (req, res) => {
  try {
 
    const { productId, orderId } = req.body;

    const userId = req.session.user;
    
   
    const orderData= await order.findOne({_id:orderId}).populate("orderedItem.productId")
    .populate("deliveryAddress")
    .populate("userId")
    
    const paymentMethod=orderData.paymentMethod

    let quantity = 0;

    
    for (const item of orderData.orderedItem) {
      if (item.productId._id.toString() === productId) {
        quantity = item.quantity;
        break; 
      }
    }
    let productAmount=0
    for (const item of orderData.orderedItem) {
      if (item.productId._id.toString() === productId) {
        productAmount = item.totalProductAmount;
        break; 
      }
    }

    await order.findOneAndUpdate(
      { _id: orderId, "orderedItem.productId": productId },
      { $set: { "orderedItem.$.productStatus": "Order Cancelled" } }
    );

    if(paymentMethod === "Wallet" || paymentMethod === "RazorPay"){
      
      await User.findByIdAndUpdate(userId, {
        $inc: { wallet:productAmount }, 
        $push: {
            walletHistory: {
                amount: productAmount,
                description: `Refund of ORDERID:${orderId}`,
                date: new Date(),
                status: "credit"
            }
        }
        }, { new: true });
    }


    await Products.findOneAndUpdate(
      { _id: productId },
      { $inc: { productquadity: +quantity } }
    );

    res.status(200).json({ message: "deletion successfull" });
  } catch (error) {
    console.log(error.messsage);
  }
};





const sortByPopularity = async (req, res) => {
  try {
    const categoryData= await Category.find().sort({id:-1})
    const productsPerPage = 12;
    let currentPage = parseInt(req.query.page) || 1;
    const totalProducts = await Products.countDocuments();
    
    
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    if (currentPage < 1) {
      currentPage = 1;
    } else if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = Math.min(startIndex + productsPerPage, totalProducts)
    
    const productData = await Products.find().populate("offerId").sort({ _id: -1 }).skip(startIndex).limit(productsPerPage)
  
    res.render("user/shop", { productData,categoryData ,currentPage, totalPages });
  } catch (error) {
    console.log(error.message);
  }
};


const sortByPriceLowToHigh = async (req, res) => {
  try {
    const categoryData= await Category.find().sort({id:1})
    const productsPerPage = 12;
    let currentPage = parseInt(req.query.page) || 1;
    const totalProducts = await Products.countDocuments();
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    if (currentPage < 1) {
      currentPage = 1;
    } else if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = Math.min(startIndex + productsPerPage, totalProducts)
    
    const productData = await Products.find().populate("offerId").sort({ productprice: 1 }).skip(startIndex).limit(productsPerPage)
    res.render("user/shop", { productData ,categoryData,currentPage, totalPages});
  } catch (error) {
    console.log(error.message);
  }
};


const sortByPriceHighToLow = async (req, res) => {
  try {
    const categoryData= await Category.find().sort({id:-1})
    const productsPerPage = 12;
    let currentPage = parseInt(req.query.page) || 1;
    const totalProducts = await Products.countDocuments();
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    if (currentPage < 1) {
      currentPage = 1;
    } else if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = Math.min(startIndex + productsPerPage, totalProducts)
    
    const productData = await Products.find().populate("offerId").sort({ productprice: -1 }).skip(startIndex).limit(productsPerPage)
    res.render("user/shop", { productData, categoryData,currentPage, totalPages});
  } catch (error) {
    console.log(error.message);
  }
};

const sortByAtoZ = async (req, res) => {
  try {
    const categoryData= await Category.find().sort({id:1})
    const productsPerPage = 12;
    let currentPage = parseInt(req.query.page) || 1;
    const totalProducts = await Products.countDocuments();
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    if (currentPage < 1) {
      currentPage = 1;
    } else if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = Math.min(startIndex + productsPerPage, totalProducts)
    
    const productData = await Products.find().populate("offerId").sort({ productname: 1 }).skip(startIndex).limit(productsPerPage)
    res.render("user/shop", { productData, categoryData,currentPage, totalPages});
  } catch (error) {
    console.log(error.message);
  }
};

const sortByZtoA = async (req, res) => {
  try {
    const categoryData= await Category.find().sort({id:-1})
    const productsPerPage = 12;
    let currentPage = parseInt(req.query.page) || 1;
    const totalProducts = await Products.countDocuments();
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    if (currentPage < 1) {
      currentPage = 1;
    } else if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = Math.min(startIndex + productsPerPage, totalProducts)
    
    const productData = await Products.find().populate("offerId").sort({ productname: -1 }).skip(startIndex).limit(productsPerPage)
    res.render("user/shop", { productData,categoryData,currentPage, totalPages });
  } catch (error) {
    console.log(error.message);
  }
};

//todo---------------------------------------------------weeek3 project----------------------------------------------------------

const loadWishliist = async (req, res) => {
  try {
    const userId = req.session.user;
    const wishlistData = await Wishlist.find({ userId }).populate(
      "products.productId"
    );
    const user=req.session.user
    const cartData = await Cart.find({ userId: user });

    
    let productcount = 0;
    for (const cart of cartData) {
      productcount += cart.products.length;
    }
    

    res.render("user/wishlist", { wishlistData ,productcount});
  } catch (error) {
    console.log(error.message);
  }
};

const addProductInWishlist = async (req, res) => {
  try {
    const { id } = req.body;
    const userId = req.session.user;

    const existingProduct = await Wishlist.findOne({
      userId: req.session.user,
      "products.productId": id,
    });

    if (existingProduct) {
      return res.json({ message: "exists" });
    }
    const wishlists = await Wishlist.findOneAndUpdate(
      { userId: req.session.user },
      {
        $addToSet: {
          products: {
            productId: id,
          },
        },
      },
      { new: true, upsert: true }
    );

    res.json({ message: "success" });
  } catch (error) {
    console.log(error.message);
  }
};

const removeWishlistProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.user;
    const wishlistData = await Wishlist.find({ userId }).populate(
      "products.productId"
    );

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({ error: "Wishlist not found" });
    }
    wishlist.products = wishlist.products.filter(
      (product) => product.productId.toString() !== productId
    );
    await wishlist.save();

    res
      .status(200)
      .json({ message: "Product removed from wishlist successfully" });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyOrder = async (req, res) => {
  try {
    const { razorpay_signature, order_id, paymentId, couponCode } = req.body;
    let key_secret = "DQNPLFsGnpzS3Jw8pPszj7Xv";
    const userId = req.session.user;
    const cartData = await Cart.findOne({ userId }).populate(
      "products.productId"
    );

    const orderedItems = cartData.products.map((product) => {
      const totalProductAmount =
        product.quantity * (product.productId?.price || 0);
      return {
        productId: product.productId,
        quantity: product.quantity,
        productStatus: "pending",
        totalProductAmount: product.totalPrice,
      };
    });

    let newOrder = req.session.newOrders;

    const curentData = new order({
      userId: newOrder.userId,
      cartId: newOrder.cartId,
      orderId: newOrder.orderId,
      orderedItem: newOrder.orderedItem,
      orderAmount: newOrder.orderAmount,
      deliveryAddress: newOrder.deliveryAddress,
      paymentStatus: "pending",
      deliveryDate: newOrder.deliveryDate,
      shippingDate: newOrder.deliveryDate,
      paymentMethod: newOrder.paymentMethod,
    });

    await curentData.save();

    const cId = curentData._id;

    var success = validatePaymentVerification(
      { order_id: order_id, payment_id: paymentId },
      razorpay_signature,
      key_secret
    );
    if (!success) {
      await order.findByIdAndUpdate(
        { _id: cId },
        { paymentStatus: "Payment Failed" });
      res.status(400).json({ success: false, message: "Payment verification failed" });

    } else {
      
      await order.findByIdAndUpdate({ _id: cId },{ paymentStatus: "Payment Successfull" });

      for (const item of orderedItems) {
        const productId = item.productId;
        const quantity = item.quantity;

        await Products.findOneAndUpdate(
          { _id: productId },
          { $inc: { productquadity: -quantity } }
        );
      }
      if (couponCode) {
        
        const couponData = await Coupon.findOneAndUpdate(
          { couponCode: couponCode },
          { $push: { usedUser: { userId: req.session.user, used: true } } },
          { new: true }
        )
        const couponDeduction = await Coupon.findOne({ couponCode: couponCode })
        const discountAmount1 = couponDeduction.discountAmount
        await order.findOneAndUpdate(
          { _id: curentData._id },
          { $set: { couponDeduction: discountAmount1 } }, { new: true })
      }
      

      await Cart.deleteOne({ userId: req.session.user });
      res.status(200).json({success: true,message: "Payment verification successful",curentData: curentData._id,});
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};



const verifyCoupon = async (req, res) => {
  try {
    const { couponCode, totalDiscount } = req.body;
    const userId = req.session.user;
    const couponData = await Coupon.findOne({ couponCode: couponCode })
 
    const cartDetiles = await Cart.find({ userId: userId }).populate("products.productId");

    let total = 0;

    cartDetiles.forEach((item) => {
      item.products.forEach((product) => {
        total += product.totalPrice
      });
    });
 
    if (couponData===null) {
     
      return res.json({ message: "Coupon not found" });
    }
    const couponDiscount= couponData.discountAmount
    if(couponData.expiryDate < Date.now()){
     
      return res.json({message: "Coupon Expired"})

    }

    if (totalDiscount < couponData.minAmount) {
      return res.json({ message: "minmum total amount require" })
    }


    const userFound = couponData.usedUser.find(user => user.userId.toString() === req.session.user);
 
    if (userFound || undefined) {
      return res.json({ message: "Coupon already used" });
    } else {
      let sumTotal = total - couponData.discountAmount;
      return res.status(200).json({message:"coupon added Successfully", total: sumTotal,couponDiscount:couponDiscount });

    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const userReturnProduct = async  (req,res)=>{
  try {
    const{productId, order_id,paymentMethod,quantity,totalProductAmount, reason}=req.body
    const userId = req.session.user;
   

    if(paymentMethod==="Cash On Delivery"){


    const updatedOrder = await order.findOneAndUpdate(
      { _id: order_id, 'orderedItem.productId': productId },
      { $set: { 'orderedItem.$.productStatus': 'Return Requested',
      'orderedItem.$.returnRequest': true,
      'orderedItem.$.returnReason': `${reason}`} },
      { new: true });

    }else if (paymentMethod==="RazorPay"){

      const updatedOrder = await order.findOneAndUpdate(
      { _id: order_id, 'orderedItem.productId': productId },
      { $set: { 'orderedItem.$.productStatus': 'Return Requested',
      'orderedItem.$.returnRequest': true,
      'orderedItem.$.returnReason': `${reason}`} },
      { new: true });

    }else if(paymentMethod==="Wallet"){

      const updatedOrder = await order.findOneAndUpdate(
      { _id: order_id, 'orderedItem.productId': productId },
      { $set: { 'orderedItem.$.productStatus': 'Return Requested',
      'orderedItem.$.returnRequest': true ,
      'orderedItem.$.returnReason': `${reason}`} },
      { new: true });

      

    }

    res.json({message :"Return requested Successfully"})
    
  } catch (error) {
    console.log(error.message)
  }
}

const userSearch= async (req,res)=>{
  try {
  const productData= await Products.find().populate("offerId");
  const{search}=req.body

  const matchingProducts = productData.filter(product =>
    product.productname.toLowerCase().includes(search.toLowerCase())
);

   res.json({result :matchingProducts})
  } catch (error) {
    console.log(error.message)
  }
}

const searchCategoryName= async (req,res)=>{
  try {
    const {category}= req.body
    const productData= await Products.find({categoryId:category}).populate("offerId").sort({_id:-1})
   
    res.json({result :productData})
  } catch (error) {
    console.log(error.message)
  }
}
const removeCoupon= async (req,res)=>{
  try {
    const {couponCode}= req.body
    const userId= req.session.user

    const couponData= await Coupon.findOne({couponCode:couponCode})

    if (!couponData) {
      
      return res.status(404).json({ message: "Coupon not found" });
    }

   
   
    res.json({message:"founded"})
  } catch (error) {
    console.log(error.message)
  }
}

const proceedToCheckout= async (req,res)=>{
  try {

    const user = req.session.user;


    const cartDetiles = await Cart.findOne({ userId: user }).populate("products.productId");

   
    let message = "";
    if (!cartDetiles    ) {
      message = "Please ad Products in cart"
      return res.send(message)
      
    }

   
    for (let i = 0; i < cartDetiles.products.length; i++) {
      const product = cartDetiles.products[i];
      if (product.productId.productquadity === 0) {
        
        message = "Please remove out-of-stock items from the cart.";
      }
    }
    
    if (cartDetiles.products.length===0) {
      message = "Please ad Products in cart";
    }

    res.send(message || "Proceed to checkout");
  } catch (error) {
    console.log(error.message)
  }
}

const headerCount= async (req,res)=>{
  try {
    const userId= req.session.user 
    let cartCount = 0; // Initialize cartCount to 0
    
    if (userId) {
      const cartData = await Cart.findOne({ userId }); // Assuming Cart is your Mongoose model
      
      if (cartData && Array.isArray(cartData.products) && cartData.products.length > 0) {
        // Sum up the quantities of all products in the cart
        cartCount = cartData.products.reduce((total, product) => total + product.quantity, 0);
      }
    }
    res.send('/partials/maiheader',{cartCount})
  } catch (error) {
    console.log(error.message)
  }
}


//--------------------------------------------------------End load OrderPAge -------------------------------------------

// -------------------Exporting Controllers-----------------------

module.exports = {
  loadRegister,
  insertUser,
  verifyEmail,
  otpLogin,
  loadLogin,
  userLogin,
  loadUserProfile,
  logout,
  resendOtp,
  home,
  backToUserHome,
  loadShopPage,
  loadAboutPage,
  loadContactPage,
  loadProductTab,
  loadGoogleAuth,
  loadViewCart,
  editUseprofile,
  updateUserProfile,
  updateUserPassword,
  loadAddressPage,
  addUserAddress,
  loadEditUser,
  updateUserAddress,
  deleteUseraddress,
  addProductInCart,
  quantityControll,
  deleteCartProduct,
  loadtCheckoutPage,
  editUseraddressInCheckout,
  updatecartAddress,
  addCheckoutAddress,
  placeOrder,
  loadOrderPage,
  orderCancel,
  sortByPopularity,
  sortByPriceLowToHigh,
  sortByPriceHighToLow,
  sortByAtoZ,
  sortByZtoA,
  loadWishliist,
  addProductInWishlist,
  removeWishlistProduct,
  verifyOrder,
  verifyCoupon,
  userReturnProduct,
  userSearch,
  searchCategoryName,
  removeCoupon,
  proceedToCheckout,
  headerCount,
 

};

// ------------------------------End------------------------------------
