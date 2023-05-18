var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helper')
/* GET users listing. */
router.get('/', function(req, res, next) {
productHelper.getAllProduct().then((product)=>{
  console.log(product);
  res.render('admin/view-product',{admin:true,product});
})

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
router.get('/delete-product/:id',(req,res)=>{
  let productId=req.params.id
  console.log(productId)
  productHelper.deleteProduct(productId).then((response)=>{
    res.redirect('admin/')
  })

})

module.exports = router;