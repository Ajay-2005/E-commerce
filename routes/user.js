var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helper')
/* GET home page. */
router.get('/', function (req, res, next) {
  productHelper.getAllProduct().then((product)=>{
    console.log(product);
  res.render('user/view-product', { product,admin:false});

 
  
});
})
router.get('/login',(req,res)=>{
  res.render('user/login')
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
module.exports = router;
