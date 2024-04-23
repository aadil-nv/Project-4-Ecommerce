const express = require("express");
const admin_route = express();
const bodyParser = require("body-parser");
const admincontroller = require("../controllers/admincontroller");
// const admincontroller = require("../controllers/admincontroller");
const multer=require('multer')
const adminAuth = require("../middleware/adminAuth");




admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
    }
  });
  
const upload = multer({ storage: storage });


admin_route.post('/adminlogin',admincontroller.adminLogin)
admin_route.get('/admindashboard',adminAuth.isLogin,admincontroller.adminDashboard)
admin_route.get('/userslist',adminAuth.isLogin,admincontroller.adminUsersList)
admin_route.get('/addproduct',adminAuth.isLogin,admincontroller.addProduct)
admin_route.get('/categorymanagement',adminAuth.isLogin,admincontroller.categoryManage)
admin_route.get('/blockuser',adminAuth.isLogin,admincontroller.blockUser)
admin_route.get('/addcategory',adminAuth.isLogin,admincontroller.addListCategory)

admin_route.post('/addcategory',adminAuth.isLogin,admincontroller.addDetilesCategory)

admin_route.get('/adminBlockcategory/:id',adminAuth.isLogin,admincontroller.blockCategory);
admin_route.get('/editCategory/:id',adminAuth.isLogin,admincontroller.editCategory)
admin_route.post("/editCategory",adminAuth.isLogin, admincontroller.updateCategory);
admin_route.get('/productlist',adminAuth.isLogin,admincontroller.productList)
admin_route.get('/editproductdetiles/:id',adminAuth.isLogin,admincontroller.editProductDetiles)
admin_route.post('/addproduct',adminAuth.isLogin,admincontroller.addNewProduct)
admin_route.post('/editcategoryfetch/:id',adminAuth.isLogin,admincontroller.updateCategoryfetch)
admin_route.post('/editproductdetilesfetch/:id',adminAuth.isLogin,upload.array('photos'),admincontroller.updateProductsFetch)
admin_route.get('/listProduct',adminAuth.isLogin,admincontroller.listProduct) 
admin_route.get('/editproductdetilesfetch/:id',adminAuth.isLogin,admincontroller.deleteProductImage)



admin_route.get('/orderslist',adminAuth.isLogin,admincontroller.adminOrdersList)
admin_route.get('/orderdetiles/:id',adminAuth.isLogin,admincontroller.adminOrderDetiles)
admin_route.post('/orderdetiles/:id',adminAuth.isLogin,admincontroller.adminChangeOrderStatus)



admin_route.get('/admin/couponlist',adminAuth.isLogin,admincontroller.admincouponlist)
admin_route.get('/admin/createcoupon',adminAuth.isLogin,admincontroller.admincouponmanagement)

admin_route.post('/admin/createcoupon',adminAuth.isLogin,admincontroller.addNewCoupon)
admin_route.post('/admin/deletecoupon',admincontroller.deleteCoupon)

admin_route.get('/admin/offerlist',adminAuth.isLogin,admincontroller.adminOfferList)
admin_route.get('/admin/createoffer',adminAuth.isLogin,admincontroller.createCoupon)

admin_route.post('/admin/createoffer',adminAuth.isLogin,admincontroller.addNewOffer)
admin_route.post('/admin/selectoffertype',adminAuth.isLogin,admincontroller.selectOfferType)
admin_route.get('/admin/salesreports',adminAuth.isLogin,admincontroller.totalSalesReport)


admin_route.get('/admin/dailysalesreport',adminAuth.isLogin,admincontroller.dailySalesReport)
admin_route.get('/admin/weeklysalesreport',adminAuth.isLogin,admincontroller.weeklySalesReport)
admin_route.get('/admin/monthlysalesreport',adminAuth.isLogin,admincontroller.monthlySalesReport)
admin_route.get('/admin/yearlysalesreport',adminAuth.isLogin,admincontroller.yearlySalesReport)



admin_route.post('/admin/filtercustomdate',adminAuth.isLogin,admincontroller.filterCustomDate)


admin_route.get('/admin/brandsmanagement',adminAuth.isLogin,admincontroller.brandManagement)
admin_route.post('/admin/brandsmanagement',adminAuth.isLogin,admincontroller.addNewBrand)


admin_route.post('/generate-pdf',adminAuth.isLogin,admincontroller.downloadSalesReport)

admin_route.post('/admin/graphdata',adminAuth.isLogin,admincontroller.graphData)

admin_route.post('/admin/approvereturnrequest',adminAuth.isLogin,admincontroller.approveRetrunRequest)
admin_route.post('/admin/deleteoffer',adminAuth.isLogin,admincontroller.deleteOffer)

admin_route.post("/admin/adminlogout",adminAuth.isLogin,admincontroller.adminLogout )

module.exports = admin_route;