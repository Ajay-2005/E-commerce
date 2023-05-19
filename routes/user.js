var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helper')
var userHelper = require('../helpers/user-helper')
/* GET home page. */
router.get('/', function (req, res, next) {
  let user = req.session.user
  console.log(user)
  productHelper.getAllProduct().then((product) => {

    res.render('user/view-product', { product, user });



  });
})
router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/")
  }
  res.render('user/login', { "loginErr": req.session.loginErr })
  req.session.loginErr = false
})
router.get('/signup', (req, res) => {
  res.render('user/signup')
})
router.post('/signup', async (req, res) => {
  try {
    const data = await userHelper.doSignup(req.body)
    console.log(data)
  }
  catch (err) {
    console.log(err)
  }
})
router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')


    }
    else {
      req.session.loginErr = "invalid Email or Password"
      res.redirect("/login")
      console.log(response)
    }
  })
})
router.get("/logout", (req, res) => {
  req.session.destroy()
  res.redirect("/login")
})
router.get("/product-details", (req, res) => {
  productHelper.getAllProduct().then((product) => {
    res.render('user/product-details', { product });
  })
})
router.get("/forgot-password",(req,res)=>{
  res.render("user/forgot-password")
})
router.post("/forgot-Password",async (req,res)=>{
const email=req.body.email
console.log(email)
try{
  const token=userHelper.generateToken();
  
  const result = await userHelper.updateUserResetToken(email,token);
  console.log(result)
 
  if (!result.value){
    return res.status(404).json({message:'user not found'})
  }
  const resetlink='http://localhost:3000/forgot-password?token=$(token)'
  await userHelper.sendPasswordResetEmail(email,resetlink);
  return res.status(200).json({message:'password reset email sent'})
 
}
catch(err){
  console.log(err);
  return res.status(404).json({message:"internal server Error"})
}
})
module.exports = router;
