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
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
require("dotenv").config();
var {
  validatePaymentVerification,
} = require("razorpay/dist/utils/razorpay-utils");

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
    const ProductData = await Products.find();
    res.render("user/index", { ProductData });
  } catch (erorr) {
    console.log(erorr.message);
  }
};
// ------------------------------End------------------------------------

// -------------User Inserting Data in signup page----------------

const insertUser = async (req, res) => {
  try {
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
    const storedEmail = await Otp.findOne({ Otps: req.body.otp }).sort({
      createdAt: -1,
    });
    const storedOtp = storedEmail.otp;
    const { n1, n2, n3, n4 } = req.body;
    const userOtp = `${n1}${n2}${n3}${n4}`;

    if (storedOtp == userOtp) {
      await userData.save();
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
    const userData = await User.findOne({ _id: req.session.user });
    const addressData = await Address.find({ userId: req.session.user });
    const orderData = await order
      .find({ userId: req.session.user })
      .populate("orderedItem.productId");
    const couponData = await Coupon.find();

    let added = req.query.msg;

    if (User) {
      const message = req.flash("succ");
      if (added) {
        return res.render("user/userprofile", {
          userData,
          addressData,
          message,
          added,
          orderData,
          couponData,
        });
      } else {
        return res.render("user/userprofile", {
          userData,
          addressData,
          message,
          orderData,
          couponData,
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
    const ProductData = await Products.find();

    res.render("user/index", { ProductData, User: req.session.user });
  } catch (error) {
    console.log(error.message);
  }
};
// ----------------------------------------------End--------------------------------------------

// ----------------------------------------------Loading ShopPage-------------------------------------------

const loadShopPage = async (req, res) => {
  try {
    const productData = await Products.find();

    res.render("user/shop", { User, productData });
  } catch (error) {
    console.log(error.message);
  }
};

// ----------------------------------------------End--------------------------------------------

// ----------------------------------------------Loading AboutPage-------------------------------------------

const loadAboutPage = async (req, res) => {
  try {
    res.render("user/about", { User });
  } catch (error) {
    console.log(error.message);
  }
};

// ----------------------------------------------Ending AboutPage-------------------------------------------

// ----------------------------------------------Loading ShopPage-------------------------------------------
const loadContactPage = async (req, res) => {
  try {
    res.render("user/contact", { User });
  } catch (error) {
    console.log(error.message);
  }
};

// ----------------------------------------------End ShopPage-------------------------------------------

// ----------------------------------------------Loading Product Tab-------------------------------------------

const loadProductTab = async (req, res) => {
  try {
    const productId = req.params.id;
    const savedData = await Products.findById(productId);

    if (savedData) {
      return res.render("user/producttab", { savedData: savedData });
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
      req.session.user = gUser;
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

    const cartDetiles = await Cart.find({ userId: user }).populate(
      "products.productId"
    );
    let total = 0;

    cartDetiles.forEach((item) => {
      item.products.forEach((product) => {
        total += product.quantity * product.productId.productprice;
      });
    });

    res.render("user/cart", { cartDetiles, total });
  } catch (error) {
    console.log(error.message);
  }
};

// ----------------------------------------------Ending  Google Auth-------------------------------------------

// ----------------------------------------------Editing User Dateiles-------------------------------------------

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
    res.render("user/address");
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

    res.render("user/editaddress", { addressData });
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

    const existingProduct = await Cart.findOne({
      userId: userId,
      "products.productId": productId,
    });

    if (existingProduct) {
      return res.status(400).json({ message: "Product already in cart" });
    }

    const productData = await Products.findById(productId);

    const add = await Cart.findOneAndUpdate(
      { userId: req.session.user },
      {
        $addToSet: {
          products: {
            productId: productId,
            quantity: 1,
            totalPrice: productData.productprice,
          },
        },
      },
      { new: true, upsert: true }
    );
    await Cart.findOneAndUpdate(
      { userId: userId },
      { $set: { total: productData.productprice } },
      { new: true }
    );
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
    const product = await Products.findOne({ _id: change });
    const productQuantity = product.productquadity;
    const total = qty * product.productprice;

    if (qty > productQuantity) {
      return res.json({ messages: "Out of Stock" });
    }

    const update = await Cart.findOneAndUpdate(
      { userId: req.session.user, "products.productId": change },
      { $set: { "products.$.quantity": qty, "products.$.totalPrice": total } },
      { new: true }
    );

    const cartDetiles = await Cart.find({ userId: user }).populate(
      "products.productId"
    );
    let totalAmount = 0;

    cartDetiles.forEach((item) => {
      item.products.forEach((product) => {
        totalAmount += product.totalPrice;
      });
    });
    await Cart.findOneAndUpdate(
      { userId: user },
      { $set: { total: totalAmount } },
      { new: true }
    );

    res.json({ totalAmount, productQuantity });
  } catch (error) {
    console.log(error.message);
  }
};

// ---------------------------------------------- End Increasing decresing quantity -------------------------------------------

// ---------------------------------------------- Delte cartProduct -------------------------------------------

const deleteCartProduct = async (req, res) => {
  try {
    const deleteId = req.params.id;
    const userId = req.session.user;

    const updatedCart = await Cart.findOneAndUpdate(
      { userId: userId },
      { $pull: { products: { productId: deleteId } } },
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
    const cartDetiles = await Cart.find({ userId: userId }).populate(
      "products.productId"
    );

    let total = 0;

    cartDetiles.forEach((item) => {
      item.products.forEach((product) => {
        total += product.quantity * product.productId.productprice;
      });
    });

    res.render("user/checkout", { addressData, cartDetiles, total });
  } catch (error) {
    console.log(error.message);
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
    const { activeAddressId, paymentmethod, totalDiscount, couponCode } =
      req.body;
    console.log("ccccccccccccccccccccccccccccccccccccccccccccccc", couponCode);

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
    const cartData = await Cart.findOne({ userId }).populate(
      "products.productId"
    );

    console.log("=-==-==-=-=-==-=-==-=-=-=-=--=", cartData);
    const currentAddress = await Address.findById(activeAddressId);

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

    const orderAmount = orderedItems.reduce(
      (total, item) => total + item.totalProductAmount,
      0
    );

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
        key_id: "rzp_test_nexg64Tm176iuH",
        key_secret: "DQNPLFsGnpzS3Jw8pPszj7Xv",
      });

      razorpayInstance.orders.create(
        options,

        (err, order) => {
          if (err) {
            console.log(err);
            res.json({ success: false });
          } else {
            res.json({
              order: order,
              success: true,
              order_id: order.id,
              key_id: "rzp_test_nexg64Tm176iuH",
              paymentMethod: paymentmethod,
              couponCode:couponCode
            });
          }
        }
      );
    } else {
      await newOrder.save();

     
      const userIdObjectId = new mongoose.Types.ObjectId(userId);
      const couponData = await Coupon.findOneAndUpdate({couponCode: couponCode},{$push:{usedUser:{userId:userIdObjectId,used:true,},},},{new:true});

      for (const item of orderedItems) {
        const productId = item.productId;
        const quantity = item.quantity;

        await Products.findOneAndUpdate(
          { _id: productId },
          { $inc: { productquadity: -quantity } }
        );
      }

      await Cart.deleteOne({ userId: req.session.user });
      res.status(200).json({ newOrder, paymentmethod });
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
      .populate("userId");

    res.render("user/orders", { orderData });
  } catch (error) {
    console.log(error.message);
  }
};

const orderCancel = async (req, res) => {
  try {
    const { productId, orderId } = req.body;

    const userId = req.session.user;

    await order.findOneAndUpdate(
      { _id: orderId, "orderedItem.productId": productId },
      { $set: { "orderedItem.$.productStatus": "Order Cancelled" } }
    );

    res.status(200).json({ message: "deletion successfull" });
  } catch (error) {
    console.log(error.messsage);
  }
};

const sortByPopularity = async (req, res) => {
  try {
    const productData = await Products.find().sort({ _id: -1 });
    res.render("user/shop", { productData });
  } catch (error) {
    console.log(error.message);
  }
};
const sortByPriceLowToHigh = async (req, res) => {
  try {
    const productData = await Products.find().sort({ productprice: 1 });
    res.render("user/shop", { productData });
  } catch (error) {
    console.log(error.message);
  }
};
const sortByPriceHighToLow = async (req, res) => {
  try {
    const productData = await Products.find().sort({ productprice: -1 });
    res.render("user/shop", { productData });
  } catch (error) {
    console.log(error.message);
  }
};
const sortByAtoZ = async (req, res) => {
  try {
    const productData = await Products.find().sort({ productname: 1 });
    res.render("user/shop", { productData });
  } catch (error) {
    console.log(error.message);
  }
};
const sortByZtoA = async (req, res) => {
  try {
    const productData = await Products.find().sort({ productname: -1 });

    res.render("user/shop", { productData });
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

    res.render("user/wishlist", { wishlistData });
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
      return res.json({ message: "Product already exists in wishlist" });
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

    res.json({ message: "product added to wishlist successfully" });
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
    const { razorpay_signature, order_id, paymentId , couponCode } = req.body;
    console.log("----------------------------------------",couponCode)
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
        { paymentStatus: "Payment Failed" }
      );
      res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    } else {
      await order.findByIdAndUpdate(
        { _id: cId },
        { paymentStatus: "Payment Successfull" }
      );
      const userIdObjectId = new mongoose.Types.ObjectId(userId);
      const couponData = await Coupon.findOneAndUpdate({couponCode: couponCode},{$push:{usedUser:{userId:userIdObjectId,used:true,},},},{new:true});

      for (const item of orderedItems) {
        const productId = item.productId;
        const quantity = item.quantity;

        await Products.findOneAndUpdate(
          { _id: productId },
          { $inc: { productquadity: -quantity } }
        );
      }

      await Cart.deleteOne({ userId: req.session.user });

      res
        .status(200)
        .json({
          success: true,
          message: "Payment verification successful",
          curentData: curentData._id,
        });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};



const verifyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.session.user;
    const couponData = await Coupon.findOne({ couponCode: couponCode });
    console.log("==================================================")
    console.log(couponData)
    

    console.log("==================================================")
    discountAmount = couponData.discountAmount;
    const cartDetiles = await Cart.find({ userId: userId }).populate("products.productId");

    let total = 0;

    cartDetiles.forEach((item) => {
      item.products.forEach((product) => {
        total += product.quantity * product.productId.productprice;
      });
    });

    if (!couponData) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const userFound = couponData.usedUser.find(
      (user) => user.userId.toString() === userId && user.used === true 
    );

    console.log("****************************************")
    console.log(userFound)
    console.log("****************************************")

    if (userFound || undefined ) {
      console.log("fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
      return res.json({ message:"Coupon already used" });
    }else{
      let sumTotal = total - couponData.discountAmount;
      return res.status(200).json({ total: sumTotal });

    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message:"Internal server error" });
  }
};

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
};

// ------------------------------End------------------------------------
