var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helper')
var userHelper=require('../helpers/user-helper')

/* GET home page. */
router.get('/', function (req, res, next) {
  let user=req.session.user
  console.log(user)
  productHelper.getAllProduct().then((product)=>{
    
  res.render('user/view-product', { product,user});
    
 
  
});
})
router.get('/login',(req,res)=>{
  res.render('user/login')
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup', async (req, res) => {
  try{
    const data=await userHelper.doSignup(req.body)
    console.log(data)
  }
  catch(err){
    console.log(err)
  }
})
router.post('/login',(req,res)=>{
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
      

    }
    else{
      res.redirect("/login")
      console.log(response)
    }
  })
})
router.get("/logout",(req,res)=>{
  req.session.destroy()
  res.redirect("/login")
})

module.exports = router;
