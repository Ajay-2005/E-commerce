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
    await userHelper.doSignup(req.body).then((response) => {
      console.log(response)
      req.session.loggedIn = true
      req.session.user = response
      res.redirect('/')
    })

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
router.get("/product", (req, res) => {
  productHelper.getAllProduct().then((product) => {
    res.render("user/product", { product })
  })
})
router.get("/product-details/:name", async (req, res) => {

  let productName = req.params.name;
  console.log(productName)
  const product = await productHelper.getProductByName(productName);
  const similarProducts = await productHelper.getSimilarProducts(productName);

  res.render("user/product-details", { product, similarProducts });
});
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect("/login")
  }
}
router.get("/cart", verifyLogin, async (req, res) => {
  let product = await userHelper.getCartProducts(req.session.user._id)
  console.log(product)
  res.render("user/cart", { product, user: req.session.user })
})
router.get("/add-to-cart/:id", verifyLogin, async (req, res) => {
  userHelper.addToCart(req.params.id, req.session.user._id).then(() =>
    res.redirect("/"))
})

router.get("/forgot-password", (req, res) => {
  res.render("user/forgot-password")
})
router.post("/forgot-password", async (req, res) => {
  const email = req.body.email;
  console.log(email)
  try {
    const token= userHelper.generateToken()
    await userHelper.updateUserResetToken(email, token);
    console.log(token)
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    await userHelper.sendPasswordResetEmail(email, resetLink);

 
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/reset-password", async (req, res) => {
  const token = req.query.token
  console.log(token)
  res.render("user/reset-password", { token })
})
router.post("/reset-password/:token", async (req, res) => {
  const token = req.params.token;  // Access the token from the URL params using req.params
  const password = req.body.password;
  
  try {
    const user = await userHelper.getUserByResetToken(token);
    console.log(user);
    if (user) {
      await userHelper.updatePassword(user._id, password);
      res.redirect("/login");
    } else {
      res.status(404).json({ message: "reset token expired" });
    }
  } catch (error) {
    console.log(error);
  }
});


module.exports = router;
