var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helper')
/* GET users listing. */
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
      next()
  }
  else{
    res.redirect("/admin/login")
  }
}
router.get('/',verifyLogin,(req, res)=>{
  productHelper.getAllProduct().then((product)=>{
    console.log(product);
    res.render('admin/view-product',{admin:true,product});
  })
})
router.get('/add-product',(req,res)=>{
  res.render('admin/add-product')

})
router.post('/add-product',(req,res)=>{
  console.log(req.body)
  console.log(req.files.image)
  productHelper.addProduct(req.body,(insertedId)=>{
    let image=req.files.image
  image.mv('./public/product-images/'+insertedId+'.jpeg',(err,done)=>{
    if(!err){
      res.render("admin/add-product")
    }else{
      console.log(err);
    }
    
  })
 
  })
})
const { ObjectId } = require('mongodb');
const userHelper = require('../helpers/user-helper');

router.get('/delete-product/:id', (req, res) => {
  let productId = req.params.id;
  console.log(productId)
  if (!ObjectId.isValid(productId)) {
    console.log('Invalid productId:', productId);
    return res.redirect('/admin');
   
  }
  productHelper.deleteProduct(productId).then((response) => {
    res.redirect('/admin');
 
  });
});
router.get("/edit-product/:name",async (req,res)=>{
  let productName=req.params.name
  let product=await productHelper.getProductByName(productName)
  console.log(product)
  res.render("admin/edit-product",{product})
})
router.post("/edit-product/:name",async(req,res)=>{
  productHelper.UpdateProduct(req.params.name,req.body).then(()=>{
  
    res.redirect('/admin')
  })
})

router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/admin')
  } else {
    res.render('admin/admin-login', { "loginErr": req.session.adminLoginErr, admin: true })
    req.session.adminLoginErr = false
  }
})
router.post('/login', (req, res) => {
  console.log(req.body)
  productHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.admin = response.admin
      res.redirect('/admin')


    }
    else {
      req.session.loginErr = "invalid Email or Password"
      res.redirect("admin/login")
      console.log(response)
    }
  })
})


module.exports = router;