const User = require("../models/userModel");
const Otp = require("../models/otp");
const bcrypt = require("bcrypt");
const session = require("express-session");
const nodemailer = require("nodemailer");
const path = require("path");
const { log } = require("console");
const Products = require("../models/productModel");
const Address = require("../models/addressModel");

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
   
    let added=req.query.msg

    if (User) {
      const message=req.flash('succ')
      if(added){
      return  res.render("user/userprofile", { userData,addressData,message,added });
      }else{
        return  res.render("user/userprofile", { userData,addressData,message });
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
    res.render("user/shop", { User });
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

    res.render("user/index", { ProductData });
  } catch (error) {
    console.log(error.message);
  }
};
// ----------------------------------------------Ending  Google Auth-------------------------------------------

// ----------------------------------------------Loding view Cart-------------------------------------------

const loadViewCart = async (req, res) => {
  try {
    const productData = await Products.find();
    res.render("user/cart", { productData });
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
        res.json({ already: "please check your Password" });
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
   
   if(userData){
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
    });
    await newAddress.save();
    const message="New address addedd Succesfully"
    req.flash('succ',message)
    return res.redirect("/userprofile");
   }
  } catch (error) {
    console.log(error.message);
  }
};
// ---------------------------------------------- Endingadd User Address-------------------------------------------


// ---------------------------------------------- Load edit Address-------------------------------------------

const loadEditUser=async (req,res)=>{
  try {
    const addressId=req.params.id
    
    const addressData= await Address.findOne({_id:addressId})
  

    res.render('user/editaddress',{addressData})
    
  } catch (error) {
    console.log(error.message);
  }
}


// ---------------------------------------------- End edit Address-------------------------------------------

// ----------------------------------------------  Upate user Address-------------------------------------------

const updateUserAddress=async (req,res)=>{
  try {
    const updateId= req.params.id
    
  
    
    const aData= await Address.findByIdAndUpdate({_id:updateId},{ name: req.body.username,
      mobile: req.body.usermobile,
      pincode: req.body.pincode,
      address: req.body.address,
      streetaddress: req.body.streetaddress,
      city: req.body.city,
      state: req.body.state,
      landmark: req.body.landmark
     })

    //  const message="New address addedd Succesfully"
    //  req.flash('flash2',message)
     res.json({ already: "Address changed SuccesFully" });
    

    
  } catch (error) {
    console.log(error.message)
  }
}
// ---------------------------------------------- End Updtae User Address-------------------------------------------


// ---------------------------------------------- Delte User Address-------------------------------------------

const deleteUseraddress= async (req,res)=>{
  try {
   
    const dltId=req.params.id;
    console.log("Id : ",dltId);
    const deleteData= await Address.findByIdAndDelete({_id:dltId})
    console.log(deleteData)
    // res.redirect('userprofile')
    res.status(200).json({message:"deletion successfull"});

    
  } catch (error) {
    console.log(error.message)
  }
}

// ---------------------------------------------- End Delte User Address-------------------------------------------


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
  deleteUseraddress
};

// ------------------------------End------------------------------------
