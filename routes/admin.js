var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helper')
/* GET users listing. */
router.get('/', function(req, res, next) {
productHelper.getAllProduct().then((product)=>{
  console.log(product);
  res.render('admin/admin-signup',{admin:true,product});
})
router.post("/admin-signup")
}); 
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

router.get('/delete-product/:id', (req, res) => {
  let productName = req.params.id;
  console.log(productName)
  if (!ObjectId.isValid(productId)) {
    console.log('Invalid productId:', productId);
    return res.redirect('admin/');
   
  }
  productHelper.deleteProduct(productId).then((response) => {
    res.redirect('admin/');
 
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

module.exports = router;