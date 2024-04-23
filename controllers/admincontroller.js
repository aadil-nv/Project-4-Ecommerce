const express = require("express");
const mongoose = require("mongoose");
const app = express();
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const session = require("express-session");
const Addcategory = require("../models/categoryModel");
const Products = require("../models/productModel");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const order = require("../models/orderModal");
const Coupon = require("../models/couponModal");
const Offer = require("../models/offerModal");
const Category = require("../models/categoryModel");
const Brands = require("../models/brandsModel");
const puppeteer= require("puppeteer")
const fs = require('fs');



function getWeek(date) {
  const onejan = new Date(date.getFullYear(), 0, 1);
  const millisecsInDay = 86400000;
  return Math.ceil((((date - onejan) / millisecsInDay) + onejan.getDay() + 1) / 7);
}



// ---------------------Multer image saving--------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage }).array("images", 4);

app.use(express.static(path.join(__dirname, "public")));

// ------------------------------End------------------------------------

// -------------------------Admin Eamil nad Password--------------------
const adminid = {
  adminemail: "admin007@gmail.com",
  adminpassword: "12345",
};





const adminLogin = async (req, res) => {
  try {
    const adminId=adminid
    const email = req.body.email;
    const password = req.body.password;
    
    
    if (adminid.adminemail === email && adminid.adminpassword === password) {
     req.session.admin=adminId
      res.redirect("/admindashboard");
    } else {
      return res.render("admin/adminlogin", { 
        message: "Email or Password were Incorrect",
});
    }
  } catch (error) {
    console.log(error.meaasage);
  }
};
// ------------------------------End------------------------------------

// ------------------------Loading Admin Dashboard----------------------

const adminDashboard = async (req, res) => {
  try {
    const salesReport= await order.find().populate("orderedItem.productId").populate("deliveryAddress").populate("userId").sort({_id:1})
    const productCount= await Products.countDocuments()
    const categoryCount= await Category.countDocuments()
    let totalSalesAmount = 0;
    let totalSalesAmount2 = 0;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    

    salesReport.forEach(order => {
      order.orderedItem.forEach(item => {
        if (item.productStatus === "Delivered") {
          
          if(order.couponDeduction == 0){
          totalSalesAmount += item.totalProductAmount;
        }else{
          totalSalesAmount2 += item.totalProductAmount
          totalSalesAmount=totalSalesAmount2-order.couponDeduction
        }
      }
      });
    });

    let totalCouponDeduction=0
    salesReport.forEach(item=>{
      totalCouponDeduction += item.couponDeduction
    })
    let salesCount=0
    salesReport.forEach(item=>{
      salesCount++
    })
    let overAllOrderAmount=0
    salesReport.forEach(item=>{
      overAllOrderAmount+= item.orderAmount
    })
    //!-----------------------------------------------------------------
    
    const salesReport2 = await order.find({
      paymentStatus: "Payment Successfull",
      $expr: {
          $eq: [{ $month: "$shippingDate" }, currentMonth],
          $eq: [{ $year: "$shippingDate" }, currentYear]
      }
  }).populate("orderedItem.productId").populate("deliveryAddress").populate("userId").sort({ _id: 1 });

  let monthlyEarning = 0;
 
  salesReport2.forEach(order => {
    monthlyEarning+= order.orderAmount
  });

  console.log("salesReport2",monthlyEarning)


//?------------------------------------------------------------------------------
const mostBoughtProducts = await order.aggregate([
  { $unwind: "$orderedItem" },
  {
    $group: {
      _id: "$orderedItem.productId",
      totalQuantity: { $sum: "$orderedItem.quantity" },
    },
  },
  { $sort: { totalQuantity: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "products",
      localField: "_id",
      foreignField: "_id",
      as: "productDetails",
    },
  },
  { $unwind: "$productDetails" },
  {
    $project: {
      _id: "$productDetails._id",
      productName: "$productDetails.productname",
      totalQuantity: 1,
    },
  },
]);


const mostBoughtCategories = await order.aggregate([
  { $unwind: "$orderedItem" },
  {
    $lookup: {
      from: "products",
      localField: "orderedItem.productId",
      foreignField: "_id",
      as: "productDetails"
    }
  },
  { $unwind: "$productDetails" },
  {
    $group: {
      _id: "$productDetails.categoryId",
      totalQuantity: { $sum: "$orderedItem.quantity" }
    }
  },
  { $sort: { totalQuantity: -1 } },
  { $limit: 10 }
]);


const mostBoughtBrands = await order.aggregate([
  { $unwind: "$orderedItem" },
  {
    $lookup: {
      from: "products",
      localField: "orderedItem.productId",
      foreignField: "_id",
      as: "productDetails"
    }
  },
  { $unwind: "$productDetails" },
  {
    $group: {
      _id: "$productDetails.brand",
      totalQuantity: { $sum: "$orderedItem.quantity" }
    }
  },
  { $sort: { totalQuantity: -1 } },
  { $limit: 10 }
]);



  
    res.render("admin/admindashboard",{salesReport,totalSalesAmount,totalCouponDeduction,
      salesCount,overAllOrderAmount,productCount,categoryCount,monthlyEarning,mostBoughtProducts,mostBoughtCategories,mostBoughtBrands});
  } catch (error) {
    console.log(error.message);
  }
};
// ------------------------------End------------------------------------

// ------------------------------Loading admin to UserList ------------------------------------

const adminUsersList = async (req, res) => {
  try {
      const perPage = 5;
      const page = req.query.page || 1;

      const user = await User.find()
       .sort({ _id: -1 })
       .skip((perPage * page) - perPage)
       .limit(perPage);
      
      const count = await User.countDocuments();

      res.render("admin/userslist", {
          user,
          currentPage: page,
          totalPages: Math.ceil(count / perPage)
      });
  } catch (error) {
      console.log(error.message);
  }
};

// ------------------------------End------------------------------------

// ------------------------------Loading Admin to addProduct page------------------------------------

const addProduct = async (req, res) => {
  try {
    const category = await Addcategory.find();
    const brandsData = await Brands.find();

    res.render("admin/addproduct", { category,brandsData });
  } catch (error) {
    console.log(error.message);
  }
};

// ------------------------------End------------------------------------

// ------------------------------Loading admin to CategoryMagement Page------------------------------------

const categoryManage = async (req, res) => {
  try {
      const perPage = 5;
      const page = req.query.page || 1;

      const category = await Addcategory.find()
       .sort({ _id: -1 })
       .skip((perPage * page) - perPage)
       .limit(perPage);
      
      const count = await Addcategory.countDocuments();

      res.render("admin/category", {
          category,
          currentPage: page,
          totalPages: Math.ceil(count / perPage)
      });
  } catch (error) {
      console.log(error.message);
  }
};


// ---------------------------------------------------End-----------------------------------------------------

// ----------------------------------------Admin blocking User-----------------------------------------------------

const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    const user = await User.findById(id);
    if (user.is_blocked == true) {
      await User.updateOne({ _id: id }, { is_blocked: false });
    } else {
      await User.updateOne({ _id: id }, { is_blocked: true });
    }
    res.redirect("userslist");
  } catch (error) {
    console.log(error.message);
  }
};
// ----------------------------------------------------End-----------------------------------------------------

// --------------------------------------------Loading Addcategory page----------------------------------------------------

const addListCategory = async (req, res) => {
  try {
    const category = await Addcategory.findOne();

    res.render("admin/addcategory");
  } catch (error) {
    console.log(error.message);
  }
};
// ----------------------------------------------------End----------------------------------------------------------

// ------------------------------------------Adding category Detiles---------------------------------------------

const addDetilesCategory = async (req, res) => {
  try {
    const allCategories = await Addcategory.find();

    const cateName = req.body.category;
    const cateDes = req.body.descategory;

    const lowercaseCateName = cateName.toLowerCase();
    const lowercaseCateDes = cateDes.toLowerCase();

    const existingCategoryName = allCategories.find(
      (category) => category.categoryname.toLowerCase() === lowercaseCateName
    );

    const existingCategoryDesc = allCategories.find(
      (category) => category.categorydescription.toLowerCase() === lowercaseCateDes
    );

    if (existingCategoryName) {
      return res.render("admin/addcategory", {
        message: "Category name already exists.",
      });
    }

    if (existingCategoryDesc) {
      return res.render("admin/addcategory", {
        message: "Category description already exists.",
      });
    }

    const category = new Addcategory({
      categoryname: cateName,
      categorydescription: cateDes,
      categorystatus: false,
    });
    await category.save();

    res.render("admin/addcategory", { message: "Category Added Succesfully " });
  } catch (error) {
    console.log(error.message);
  }
};

// -------------------------------------------------End-----------------------------------------------------

// ------------------------------Admin Blocking the user only login    ------------------------------------

const blockCategory = async (req, res) => {
  try {
    const categoryid = req.params.id;
    const cid = await Addcategory.findById(categoryid);
    if (cid.categorystatus == false) {
      await Addcategory.updateOne({ _id: cid }, { categorystatus: true });
    } else {
      await Addcategory.updateOne({ _id: cid }, { categorystatus: false });
    }

    res.redirect("/categorymanagement");
  } catch (error) {
    console.log(error.message);
  }
};
// --------------------------------------End-------------------------------------------------------

// ------------------------------Admin Editing page Load with category detiles----------------------------------------

const editCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const categoryid = await Addcategory.findById({ _id: id });
    if (categoryid) {
      res.render("admin/editcategory", { category: categoryid });
    } else {
      res.redirect("/categorymanagement");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// ---------------------------------------------------End---------------------------------------------------------

// -----------------------------------------Admin Updating Category detiles---------------------------------------

const updateCategory = async (req, res) => {
  try {
    const existingCategory = await Addcategory.findOne({
      categoryname: req.body.category,
    });
    const existingDescription = await Addcategory.findOne({
      categorydescription: req.body.descategory,
    });

    if (existingCategory && existingCategory._id != req.body.id) {
      res.redirect(`/editCategory/${req.body.id}`);
    } else if (existingDescription && existingDescription._id != req.body.id) {
      res.redirect(`/editCategory/${req.body.id}`);
    } else {
      await Addcategory.findByIdAndUpdate(
        { _id: req.body.id },
        {
          $set: {
            categoryname: req.body.category,
            categorydescription: req.body.descategory,
          },
        }
      );
      res.redirect("/categorymanagement");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// -----------------------------------------------End-------------------------------------------------------

// ------------------------------Loading Productlist and sending Product data intothe page ------------------------------------

const productList = async (req, res) => {
  try {
      const perPage = 10;
      const page = req.query.page || 1;

      const product = await Products.find()
       .sort({ _id: -1 })
       .skip((perPage * page) - perPage)
       .limit(perPage);
      
      const count = await Products.countDocuments();

      res.render("admin/productlist", {
          product,
          currentPage: page,
          totalPages: Math.ceil(count / perPage)
      });
  } catch (error) {
      console.log(error.message);
  }
};


// ------------------------------Updating Product  ------------------------------------

const editProductDetiles = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Products.findById(id);
    const productlist = await Products.find();
    const category = await Addcategory.find();
    const brand = await Brands.find();
    const categoryid = await Addcategory.findById({ _id: id });

    res.render("admin/editproductdetiles", { product, category ,brand});
  } catch (error) {
    console.log(error.message);
  }
};

// ------------------------------ Ending Updating Product  ------------------------------------

// --------------------------------------------Upadating Product detiles----------------------------------------------------------------

const updateProductsFetch = async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, des, price, quandity, category, photos } = req.body;
    const product = await Products.findById(productId);
    const imageCount = product.productimage.length;

    const productData = {};

    if (req.body.name) {
      await Products.findByIdAndUpdate(
        { _id: productId },
        { productname: req.body.name }
      );
    }
    if (req.body.des) {
      await Products.findByIdAndUpdate(
        { _id: productId },
        { productdescription: req.body.des }
      );
    }
    if (req.body.price) {
      await Products.findByIdAndUpdate(
        { _id: productId },
        { productprice: req.body.price }
      );
    }
    if (req.body.quandity) {
      await Products.findByIdAndUpdate(
        { _id: productId },
        { productquadity: req.body.quandity }
      );
    }
    if (req.body.category) {
      await Products.findByIdAndUpdate(
        { _id: productId },
        { categoryId: req.body.category }
      );
    }
    if (req.body.brand) {
      await Products.findByIdAndUpdate(
        { _id: productId },
        { brand: req.body.brand }
      );
    }

    const MAX_IMAGES = 4;
    const remainingImages = MAX_IMAGES - imageCount;

    if (remainingImages > 0) {
      const imageUrls = [];
      for (let i = 0; i < Math.min(req.files.length, remainingImages); i++) {
        const imageBuffer = await sharp(req.files[i].path)
          .resize({ width: 400, height: 500, fit: sharp.fit.cover })
          .toBuffer();
        const filename = `cropped_${req.files[i].originalname}`;
        imageUrls.push(filename);

        await sharp(imageBuffer).toFile(
          path.join(__dirname, `../public/uploads/${filename}`)
        );
      }
      await Products.findByIdAndUpdate(productId, {
        $push: { productimage: { $each: imageUrls } },
      });
    }

    res.redirect("/productlist");
  } catch (error) {
    console.log(error.message);
  }
};

// --------------------------------------------End  Upadating Product detile----------------------------------------------------------------

// --------------------------Adding NewProduct into Product and saving Product data Into Database------------------------------

const addNewProduct = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        errorImage.innerHTML = "Only jpg/jpeg and png files are allowed!";

        console.log(errorMsg);
        return res.redirect("/addproduct");
      }

     

      let imageUrls = [];
      if (req.files ) {
        for (i = 0; i < req.files.length; i++) {
          const imageBuffer = await sharp(req.files[i].path)
            .resize({ width: 400, height: 500, fit: sharp.fit.cover })
            .toBuffer();
          const filename = `cropped_${req.files[i].originalname}`;
          imageUrls[i] = filename;

          await sharp(imageBuffer).toFile(
            path.join(__dirname, `../public/uploads/${filename}`)
          );
        }
      }

    

      const alreadyProduct = await Products.findOne({
        productname: req.body.productName,
      });

      if (alreadyProduct) {
        const errorMsg = "Product already added";
        console.log(errorMsg);
        return res.redirect("/addproduct");
      }
      i

      const product = new Products({
        productname: req.body.productName,
        productprice: req.body.productPrice,
        productquadity: req.body.productQuantity,
        productdescription: req.body.productDescription,
        categoryId: req.body.productCategory,
        productimage: imageUrls,
        isListed: true,
        brand:req.body.productBrand
      });

      await product.save();

      res.redirect("/productlist");
    });
  } catch (err) {
    console.log(err);
  }
};
// --------------------------End Adding NewProduct into Product and saving Product data Into Database------------------------------

// --------------------------Upadating The data in the Category ------------------------------

const updateCategoryfetch = async (req, res) => {
  try {
    const catId = req.params.id;
    const { name, des } = req.body;

    const existingCategory = await Addcategory.findOne({ categoryname: name });

    const existingDescription = await Addcategory.findOne({
      categorydescription: des,
    });

    if (existingCategory && existingCategory._id != catId) {
      return res.json({ already: "Name Already in the Category" });
    } else if (existingDescription && existingDescription._id != catId) {
      return res.json({ already: "Descategory Already in the Category" });
    } else {
      await Addcategory.findByIdAndUpdate(
        { _id: catId },
        {
          $set: { categoryname: name, categorydescription: des },
        }
      );
      return res.json({ success: "Category updated successfully" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// --------------------------End Upadating The data in the Category ------------------------------

// --------------------------Listing or un listing products ------------------------------

const listProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const product = await Products.findById(id);

    if (product.isListed == true) {
      await Products.updateOne({ _id: id }, { isListed: false });
    } else {
      await Products.updateOne({ _id: id }, { isListed: true });
    }
    res.redirect("productlist");
  } catch (error) {
    console.log(error.message);
  }
};

// --------------------------Ending Listing or un listing products ------------------------------

// --------------------------Deleting Image in edit Product detiles  ------------------------------

const deleteProductImage = async (req, res) => {
  try {
    const productId = mongoose.Types.ObjectId.createFromHexString(
      req.params.id
    );
    const { name } = req.query;

    const result = await Products.findByIdAndUpdate(productId, {
      $pull: { productimage: name },
    });
    res.redirect(`/editproductdetiles/${productId}`);
  } catch (error) {
    console.log(error.message);
  }
};

// --------------------------Ending Deleting Image in edit Product detiles  ------------------------------

// --------------------------------------------Load UsersList -------------------------------------------

// const adminOrdersList = async (req, res) => {
//   try {
//     const orderData = await order
//       .find()
//       .populate("orderedItem.productId")
//       .populate("deliveryAddress")
//       .populate("userId").sort({ _id: -1 })

//     res.render("admin/orderlist", { orderData });
//   } catch (error) {
//     console.log(error.message);
//   }
// };
const adminOrdersList = async (req, res) => {
  try {
      const perPage = 10;
      const page = req.query.page || 1;

      const orderData = await order
          .find()
          .populate("orderedItem.productId")
          .populate("deliveryAddress")
          .populate("userId")
          .sort({ _id: -1 })
          .skip((page - 1) * perPage)
          .limit(perPage);

      const count = await order.countDocuments();

      res.render("admin/orderlist", {
          orderData,
          currentPage: page,
          totalPages: Math.ceil(count / perPage)
      });
  } catch (error) {
      console.log(error.message);
  }
};



const adminOrderDetiles = async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderData = await order
      .findById({ _id: orderId })
      .populate("orderedItem.productId")
      .populate("deliveryAddress")
      .populate("userId");

    res.render("admin/orderdetiles", { orderData });
  } catch (error) {
    console.log(error.message);
  }
};

const adminChangeOrderStatus = async (req, res) => {
  try {
    const { selectedStatus, productId, orderId } = req.body;


    const orderData = await order
      .find({ _id: orderId })
      .populate("orderedItem.productId")
      .populate("deliveryAddress")
      .populate("userId");

    if (selectedStatus === "null") {
      return res.status(400).json({ message: "selectedStatus is null" });
    }

    const updatedOrder = await order
      .findOneAndUpdate(
        { _id: orderId, "orderedItem.productId": productId },
        { $set: { "orderedItem.$.productStatus": selectedStatus } },
        { new: true }
      )
      .populate("orderedItem.productId")
      .populate("deliveryAddress")
      .populate("userId");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    console.log("Updated order:", updatedOrder);
    res
      .status(200)
      .json({ message: "Order status updated successfully", updatedOrder });
  } catch (error) {
    console.log(error.message);
  }
};
//!-------------------------------------------week 10-------------------------------------------------------------

const admincouponlist = async (req, res) => {
  try {

    const couponData = await Coupon.find()
    res.render('admin/couponlist', { couponData })

  } catch (error) {
    console.log(error.message)
  }
}


const admincouponmanagement = async (req, res) => {
  try {

    res.render('admin/createcoupon')

  } catch (error) {
    console.log(error.message)
  }
}

const addNewCoupon = async (req, res) => {
  try {

    const { data } = req.body


    if (!data) {
      res.json({ message: "failed" })

    } else {
      const couponname = data.couponName
      const couponcode = data.couponCode
      console.log(":::::::::::::::::::::::::::::::::::::::")
      console.log(couponcode)
      console.log(":::::::::::::::::::::::::::::::::::::::")

      const existingCouponName = await Coupon.findOne({ couponName:couponname });
      console.log("existingCouponName::",existingCouponName)
      const existingCouponCode = await Coupon.findOne({ couponCode:couponcode });
      console.log("existingCouponCode >>",existingCouponCode)

      if (existingCouponName ) {
        return res.json({ message: "Coupon name already exists" });
      }
       if (existingCouponCode) {
        return res.json({ message: "Coupon code already exists" });
      } 

      const couponData = new Coupon({

        couponName: data.couponName,
        couponCode: data.couponCode,
        discountAmount: data.couponDiscount,
        minAmount: data.couponMinAmount,
        couponDescription: data.couponDescription,
        expiryDate: data.couponExpire,
        status: true,


      })
      await couponData.save()
      res.json({ message: "Success" })
    
    }
  } catch (error) {
    console.log(error.message)
  }
}

const deleteCoupon = async (req, res) => {
  try {
    const { data } = req.body


    if (!data) {
      res.json({ message: "delete failed" })
    } else {
      await Coupon.findByIdAndDelete({ _id: data })
      res.json({ message: "delete success" })
    }
  } catch (error) {
    console.log(error.message)
  }
}




const adminOfferList = async (req, res) => {
  try {
      const perPage = 5;
      const page = req.query.page || 1;

      const offerData = await Offer.find()
          .skip((page - 1) * perPage)
          .limit(perPage);

      const count = await Offer.countDocuments();

      res.render('admin/offerlist', {
          offerData,
          currentPage: page,
          totalPages: Math.ceil(count / perPage)
      });
  } catch (error) {
      console.log(error.message);
  }
};


const createCoupon = async (req, res) => {
  try {
    const categoryData = await Addcategory.find()
    const productData = await Products.find()


    res.render('admin/createoffer', { categoryData, productData })

  } catch (error) {
    console.log(error.message)
  }
}


const addNewOffer = async (req, res) => {
  try {
    const { data } = req.body

    const newOffer = new Offer({
      offerName: data.offerName,
      description: data.offerDescription,
      percentage: data.offerPercentage,
      expiryDate: data.offerExpiryDate,
      status: data.offerStatus,
      offerType: data.offerType,
      offerTypeName: data.offerItem,

    })
    await newOffer.save()
    res.status(200).json({ message: "Offer Added Successfully" })


    let newOfferData= newOffer

    

    const offerCategoryData = await Products.find({ categoryId: data.offerItem }).populate('offerId')

    console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&")
    console.log(offerCategoryData)
    console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&")
    const offerProductData = await Products.findOne({ productname: data.offerItem }).populate('offerId')

    let productOldPercentage=offerProductData?.offerId?.percentage

    let categoryOldPercentage = 0;

    if (Array.isArray(offerCategoryData) && offerCategoryData.length > 0) {
      categoryOldPercentage = Math.max(...offerCategoryData.map(product => product.offerId?.percentage || 0));
    }
    
    
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^",categoryOldPercentage)
   
      if (newOffer.offerType === "category") {
        if( newOfferData.percentage > categoryOldPercentage  || categoryOldPercentage=== undefined){
          const offerCategoryData = await Products.find({ categoryId: newOfferData.offerTypeName })
         
          await Products.updateMany({ categoryId: newOfferData.offerTypeName }, { $set: { offerId:newOfferData} });
        
      }
      } else if(newOffer.offerType === "product") {

        if( newOfferData.percentage > productOldPercentage  || productOldPercentage=== undefined){
        const offerProductData = await Products.findOne({ productname: newOfferData.offerTypeName});

          await Products.findByIdAndUpdate(offerProductData._id, { $set: { offerId:newOfferData} });
         

        }
        
      }

  } catch (error) {
    console.log(error.message)
  }
}



const selectOfferType = async (req, res) => {
  try {
    const { selectedValue } = req.body

    if (selectedValue === "category") {
      const categoryData = await Addcategory.find()
      return res.json({ categoryData })

    } else {
      const productData = await Products.find()
      return res.json({ productData })

    }

  } catch (error) {
    console.log(error.message)
  }
}




const totalSalesReport = async (req, res) => {
  try {
    const page = req.query.page || 1; 
    const perPage = 10; 
    const skip = (page - 1) * perPage;
    const salesReport= await order.find().populate("orderedItem.productId").populate("deliveryAddress").populate("userId")
    .sort({ _id: -1 })
    .skip(skip)
    .limit(perPage);
    
    let totalSalesAmount = 0;
    let totalSalesAmount2 = 0;
    
    

    salesReport.forEach(order => {
      order.orderedItem.forEach(item => {
        if (item.productStatus === "Delivered") {
          console.log("order.couponDeduction ::::",order.couponDeduction)
          if(order.couponDeduction == 0){
          totalSalesAmount += item.totalProductAmount;
        }else{
          totalSalesAmount2 += item.totalProductAmount
          totalSalesAmount=totalSalesAmount2-order.couponDeduction
        }
      }
      });
    });

    let totalCouponDeduction=0
    salesReport.forEach(item=>{
      totalCouponDeduction += item.couponDeduction
    })
    let salesCount=0
    salesReport.forEach(item=>{
      salesCount++
    })
    let overAllOrderAmount=0
    salesReport.forEach(item=>{
      overAllOrderAmount+= item.orderAmount
    })
    
    const totalSalesCount = await order.countDocuments();
    const totalPages = Math.ceil(totalSalesCount / perPage);

   res.render('admin/salesreport',{salesReport,totalSalesAmount,totalCouponDeduction,
    salesCount,overAllOrderAmount, totalPages,
    currentPage: page})

  } catch (error) {
    console.log(error.message)
  }
}

const dailySalesReport= async(req,res)=>{
  try {
    const page = req.query.page || 1; 
    const perPage = 10; 
    const skip = (page - 1) * perPage;
    
    const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1); 

        const salesReport = await order.find({
            shippingDate: {
                $gte: today,
                $lt: tomorrow
            }
        }).sort({_id:-1}).skip(skip)
        .limit(perPage);

        let sc=await order.find({
          shippingDate: {
              $gte: today,
              $lt: tomorrow
          }
      }).sort({_id:-1})
    
    let totalSalesAmount = 0;
    let totalSalesAmount2 = 0;
    
    

    salesReport.forEach(order => {
      order.orderedItem.forEach(item => {
        if (item.productStatus === "Delivered") {
          console.log("order.couponDeduction ::::",order.couponDeduction)
          if(order.couponDeduction == 0){
          totalSalesAmount += item.totalProductAmount;
        }else{
          totalSalesAmount2 += item.totalProductAmount
          totalSalesAmount=totalSalesAmount2-order.couponDeduction
        }
      }
      });
    });

    let totalCouponDeduction=0
    salesReport.forEach(item=>{
      totalCouponDeduction += item.couponDeduction
    })
    let salesCount=0
    salesReport.forEach(item=>{
      salesCount++
    })
    let overAllOrderAmount=0
    salesReport.forEach(item=>{
      overAllOrderAmount+= item.orderAmount
    })

    let totalSalesCount = sc.length;
    const totalPages = Math.ceil(totalSalesCount / perPage);
    

    res.render('admin/salesreport',{salesReport,totalSalesAmount,totalCouponDeduction,
      salesCount,overAllOrderAmount, totalPages,
      currentPage: page}) 
    
  } catch (error) {
    console.log(error.message)
  }
}
const weeklySalesReport= async(req,res)=>{
  try {
    const page = req.query.page || 1; 
    const perPage = 10; 
    const skip = (page - 1) * perPage;
    const currentDate = new Date();


    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (startOfWeek.getDay() === 0 ? -6 : 1));

    
    const endOfWeek = new Date(currentDate);
    endOfWeek.setDate(endOfWeek.getDate() - endOfWeek.getDay() + 7);

  
    const salesReport = await order.find({
        shippingDate: { $gte: startOfWeek, $lte: endOfWeek }
    }).sort({_id:-1}).skip(skip)
    .limit(perPage);

    let sc= await order.find({
      shippingDate: { $gte: startOfWeek, $lte: endOfWeek }
  })

    let totalSalesAmount = 0;
    let totalSalesAmount2 = 0;
    
    

    salesReport.forEach(order => {
      order.orderedItem.forEach(item => {
        if (item.productStatus === "Delivered") {
          console.log("order.couponDeduction ::::",order.couponDeduction)
          if(order.couponDeduction == 0){
          totalSalesAmount += item.totalProductAmount;
        }else{
          totalSalesAmount2 += item.totalProductAmount
          totalSalesAmount=totalSalesAmount2-order.couponDeduction
        }
      }
      });
    });

    let totalCouponDeduction=0
    salesReport.forEach(item=>{
      totalCouponDeduction += item.couponDeduction
    })
    let salesCount=0
    salesReport.forEach(item=>{
      salesCount++
    })
    let overAllOrderAmount=0
    salesReport.forEach(item=>{
      overAllOrderAmount+= item.orderAmount
    })

    let totalSalesCount = sc.length;
    const totalPages = Math.ceil(totalSalesCount / perPage);

    console.log("_____________________________")
    console.log(salesReport)
    console.log(totalPages)
    console.log("_____________________________")
    

    res.render('admin/salesreport',{salesReport,totalSalesAmount,totalCouponDeduction,
      salesCount,overAllOrderAmount ,totalPages,
      currentPage: page}) 
    
  } catch (error) {
    console.log(error.message)
  }
}


const monthlySalesReport= async(req,res)=>{
  try {
    const page = req.query.page || 1; 
    const perPage = 10; 
    const skip = (page - 1) * perPage;

    const currentDate = new Date();
    
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    
    const salesReport = await order.find({
        shippingDate: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({_id:-1}).skip(skip)
    .limit(perPage);

    let sc= await order.find({
      shippingDate: { $gte: startOfMonth, $lte: endOfMonth }
  }).sort({_id:-1})

  
    
    let totalSalesAmount = 0;
    let totalSalesAmount2 = 0;
    
    

    salesReport.forEach(order => {
      order.orderedItem.forEach(item => {                                                                     
        if (item.productStatus === "Delivered") {
          console.log("order.couponDeduction ::::",order.couponDeduction)
          if(order.couponDeduction == 0){
          totalSalesAmount += item.totalProductAmount;
        }else{
          totalSalesAmount2 += item.totalProductAmount
          totalSalesAmount=totalSalesAmount2-order.couponDeduction
        }
      }
      });
    });

    let totalCouponDeduction=0
    salesReport.forEach(item=>{
      totalCouponDeduction += item.couponDeduction
    })
    let salesCount=0
    salesReport.forEach(item=>{
      salesCount++
    })
    let overAllOrderAmount=0
    salesReport.forEach(item=>{
      overAllOrderAmount+= item.orderAmount
    })

    let totalSalesCount = sc.length;
    let totalPages = Math.ceil(totalSalesCount / perPage);

    

    res.render('admin/salesreport',{salesReport,totalSalesAmount,totalCouponDeduction,
      salesCount,overAllOrderAmount, totalPages,
      currentPage: page}) 
    
  } catch (error) {
    console.log(error.message)
  }
}



const yearlySalesReport= async(req,res)=>{
  try {
    const page = req.query.page || 1; 
    const perPage = 10; 
    const skip = (page - 1) * perPage;

    const currentDate = new Date();
    
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
   
    const endOfYear = new Date(currentDate.getFullYear(), 11, 31);

    
    const salesReport = await order.find({
        shippingDate: { $gte: startOfYear, $lte: endOfYear }
    }).sort({_id:-1}).skip(skip)
    .limit(perPage);

    let sc=  await order.find({
      shippingDate: { $gte: startOfYear, $lte: endOfYear }
  }).sort({_id:-1})

    let totalSalesAmount = 0;
    let totalSalesAmount2 = 0;
    
    

    salesReport.forEach(order => {
      order.orderedItem.forEach(item => {
        if (item.productStatus === "Delivered") {
          console.log("order.couponDeduction ::::",order.couponDeduction)
          if(order.couponDeduction == 0){
          totalSalesAmount += item.totalProductAmount;
        }else{
          totalSalesAmount2 += item.totalProductAmount
          totalSalesAmount=totalSalesAmount2-order.couponDeduction
        }
      }
      });
    });

    let totalCouponDeduction=0
    salesReport.forEach(item=>{
      totalCouponDeduction += item.couponDeduction
    })
    let salesCount=0
    salesReport.forEach(item=>{
      salesCount++
    })
    let overAllOrderAmount=0
    salesReport.forEach(item=>{
      overAllOrderAmount+= item.orderAmount
    })

    let totalSalesCount = sc.length;
    const totalPages = Math.ceil(totalSalesCount / perPage);

    res.render('admin/salesreport',{salesReport,totalSalesAmount,totalCouponDeduction,
      salesCount,overAllOrderAmount, totalPages,
      currentPage: page}) 
    
  } catch (error) {
    console.log(error.message)
  }
}



const filterCustomDate= async (req,res)=>{
  try {

    const salesReport= await order.find().populate("orderedItem.productId").populate("deliveryAddress").populate("userId").sort({_id:-1});

    const {startDate, endDate}= req.body
    const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
  
  const filteredSalesReport = salesReport.filter(item => {
    const shippingDate = new Date(item.shippingDate);
    return shippingDate >= new Date(startDate) && shippingDate < adjustedEndDate;
});





res.json({ filteredSalesReport });

  } catch (error) {
    console.log(error.message)
  }
}


const brandManagement= async (req,res)=>{
  try {
    const brandsData= await Brands.find()
 
    res.render('admin/brandlist',{brandsData})
    
  } catch (error) {
    console.log(error.message)
  }
}
const addNewBrand= async (req,res)=>{
  try {
    const {brandName, brandItems}=req.body

    const newBrand= new Brands({
      brandname:brandName,
      brandItems:brandItems,
    })

    await newBrand.save()

    res.json({message:"New Branded Added Successfully"})
    
  } catch (error) {
    console.log(error.message)
  }
}

const downloadSalesReport = async (req, res) => {
  try {
    const { html } = req.body; 
    const browser = await puppeteer.launch();
    const page = await browser.newPage();


    await page.setContent(html);
    const pdfBuffer = await page.pdf();
    await browser.close();
 

    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
  }
}




const graphData = async (req, res) => {
  try {
    const { year, type } = req.body;

    if (type === 'month') {
      
      const salesData = Array(12).fill(0);
      const revenueData = Array(12).fill(0);

     
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      const allData = await order.find({
        shippingDate: { $gte: startDate, $lte: endDate }
      }).populate("orderedItem.productId").populate("deliveryAddress").populate("userId").sort({_id:-1});

      
      allData.forEach(item => {
        const month = item.shippingDate.getMonth();
        salesData[month] += item.orderAmount;
        if (item.paymentStatus === "Payment Successfull") {
          revenueData[month] += item.orderAmount;
        }
      });

     
      res.json({ labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], salesData, revenueData });
    } else if (type === 'year') {
      if (year === "2024") {
       
        const currentYear = new Date().getFullYear();
        const pastYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
        const salesData = Array(5).fill(0);
        const revenueData = Array(5).fill(0);

       
        for (let i = 0; i < 5; i++) {
          const startDate = new Date(pastYears[i], 0, 1);
          const endDate = new Date(pastYears[i], 11, 31, 23, 59, 59);
          const allData = await order.find({
            shippingDate: { $gte: startDate, $lte: endDate }
          }).populate("orderedItem.productId").populate("deliveryAddress").populate("userId").sort({_id:-1});

          allData.forEach(item => {
            salesData[i] += item.orderAmount;
            if (item.paymentStatus === "Payment Successfull") {
              revenueData[i] += item.orderAmount;
            }
          });
        }

  
        res.json({ labels: pastYears.map(String), salesData, revenueData });
      } else {
        res.status(400).json({ error: 'Invalid year provided.' });
      }
    } else {
      res.status(400).json({ error: 'Invalid type provided.' });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Failed to generate sales report.' });
  }
};




const approveRetrunRequest = async (req, res) => {
  try {
     
    let {text, decision,productId,orderId,userId,totalProductAmount,quantity}= req.body
  

    if(decision==="approve"){
       await order.findOneAndUpdate(
        { _id: orderId, 'orderedItem.productId': productId },
        { $set: { 'orderedItem.$.productStatus': 'Returned' ,
        'orderedItem.$.returnRequest':false} },
        { new: true });

        await User.findByIdAndUpdate(userId, {
        $inc: { wallet: totalProductAmount }, 
        $push: {
            walletHistory: {
                amount: totalProductAmount,
                description: `Refund of ORDERID:${orderId}`,
                date: new Date(),
                status: "credit"
            }
        }
        }, { new: true });

           await Products.findOneAndUpdate(
          { _id: productId },
          { $inc: { productquadity: +quantity } }
        );
  
  
    }else if(decision==="reject"){
      await order.findOneAndUpdate(
        { _id: orderId, 'orderedItem.productId': productId },
        { $set: { 'orderedItem.$.productStatus': 'Return request rejected',
        'orderedItem.$.returnRequest':false} },
        { new: true });

    }
  

       res.json({message :"updated successsfully"})

  } catch (error) {
      console.log(error.message)
      res.status(500).json({ error: 'Failed to generate sales report.' });
  }
}

const deleteOffer= async (req,res)=>{
  try {
    const {offerId}=req.body

    await Offer.findByIdAndDelete({_id:offerId})
    await Products.updateMany(
      { offerId: offerId },
      { $unset: { offerId: "" } }
    );
    res.json({message:"success"})
  } catch (error) {
    console.log(error.message)
  }
}


const adminLogout=async (req,res)=>{
  try {
    console.log("coming here")
    req.session.admin=null;
    res.redirect('/adminlogin')
    
  } catch (error) {
    console.log(error.message)
  }
}
// --------------------------------------------End Load UsersList -------------------------------------------

// ------------------------------------------------End--------------------------------------------------------

module.exports = {
  
  adminLogin,
  adminDashboard,
  adminUsersList,
  addProduct,
  categoryManage,
  blockUser,
  addListCategory,
  addDetilesCategory,
  blockCategory,
  editCategory,
  updateCategory,
  productList,
  editProductDetiles,
  addNewProduct,
  updateCategoryfetch,
  updateProductsFetch,
  listProduct,
  deleteProductImage,
  adminOrdersList,
  adminOrderDetiles,
  adminChangeOrderStatus,
  admincouponlist,
  addNewCoupon,
  admincouponmanagement,
  deleteCoupon,
  adminOfferList,
  createCoupon,
  addNewOffer,
  selectOfferType,
  totalSalesReport,
  dailySalesReport,
  weeklySalesReport,
  monthlySalesReport,
  yearlySalesReport,
  filterCustomDate,
  brandManagement,
  addNewBrand,
  downloadSalesReport,
  graphData,
  approveRetrunRequest,
  deleteOffer,
  adminLogout
 
};
