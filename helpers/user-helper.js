const db = require("../config/mongo connection")
const collection = require("../config/collection")
const bcrypt = require("bcrypt")
const mailer = require('nodemailer')
require("dotenv").config()
const crypto = require("crypto")
const { token } = require("morgan")
const { ObjectId } = require("mongodb");
const { response } = require("express")
const { resolve } = require("path")
const { count } = require("console")
const { rejects } = require("assert")
const Razorpay = require("razorpay")
var instances = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret

})
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      if (!userData.Password || userData.Password.trim() === "") {
        reject(new Error('Password field is requird'))
        return;
      }
      try {
        userData.Password = await bcrypt.hash(userData.Password, 10)
        const data = await db.get().collection(collection.USER_COLLECTION).insertOne(userData)

        resolve(data)
      }
      catch (err) {
        reject(err)
      }
    })
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {

      let response = {}

      const user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email:{$eq:userData.Email }})

      console.log(user)


      if (user) {

        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            console.log("login successs");
            response.user = user
            response.status = true
            resolve(response)
          }


          else {
            console.log("login failed");
            resolve({ status: false })
          }
        })

      }
      else {
        console.log("user not found")
        resolve({ status: false })
      }
    })
  },
  generateToken: () => {
    return crypto.randomBytes(20).toString('hex');
  },
  updateUserResetToken: async (email, token) => {
    try {
      const userCollection = db.get().collection(collection.USER_COLLECTION);
      const result = await userCollection.findOneAndUpdate(
        { Email: { $eq: email } }, 
        { $set: { resetToken: token } },
        { returnOriginal: false }
      );
      console.log(result);
      if (result !== null && result.value) {
        return result.value;
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      if (error.message === 'User not found') {
        return null;
      } else {
        console.error(error);
        throw error;
      }
    }
  },
  sendPasswordResetEmail: async (email, resetLink) => {
    try {

      const transporter = mailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      const mailOptions = {
        from: process.env.Email,
        to: email,
        subject: 'Password Reset',
        html: `<p>You have requested a password reset. Click the following link to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>`,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  getUserByResetToken: (token) => {
    return new Promise(async (resolve, reject) => {
      try {
        const userCollection = db.get().collection(collection.USER_COLLECTION);
        const user = await userCollection.findOne({ resetToken: token });
        resolve(user);
      } catch (error) {
        reject(error);
      }
    })
  },
  updatePassword: (userId, password) => {
    return new Promise(async (resolve, reject) => {
      try {     
        const hashedPassword = await bcrypt.hash(password, 10);
        let userCollection = db.get().collection(collection.USER_COLLECTION)
        await userCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { Password: hashedPassword }, $unset: { resetToken: "" } }
        )
        resolve()
      }
      catch (err) {
        reject(err)
      }
    })

  },
  addToCart: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      let userCart = await db.get().collection(collection.Cart_Collection).findOne({ user: new ObjectId(userId) })
      if (userCart) {
        let productExist = userCart.products.find(product => product.item == proId)
        if (productExist) {
          db.get().collection(collection.Cart_Collection).updateOne(
            { "products.item": new ObjectId(proId) },
            {
              $inc: { 'products.$.quantity': 1 }
            }
          ).then((response) => {
            resolve(response)
          })
        } else {
          db.get().collection(collection.Cart_Collection).updateOne(
            { user: new ObjectId(userId) },
            {
              $push: { products: { item: new ObjectId(proId), quantity: 1 } }
            }
          ).then((response) => {
            resolve(response)
          })
        }
      } else {
        let CartObj = {
          user: new ObjectId(userId),
          products: [{ item: new ObjectId(proId), quantity: 1 }]
        }
        db.get().collection(collection.Cart_Collection).insertOne(CartObj).then((response) => {
          resolve(response)
        })
      }
    })
  },
  getCartProducts: (userID) => {
    return new Promise(async (resolve, reject) => {
      try {
        let cartItems = await db.get().collection(collection.Cart_Collection).aggregate([
          {
            $match: {
              user: new ObjectId(userID)
            }
          },
          {
            $unwind: '$products'
          },
          {
            $project: {
              item: '$products.item',
              quantity: '$products.quantity'
            }
          },
          {
            $lookup: {
              from: collection.PRODUCT,
              localField: 'item',
              foreignField: '_id',
              as: 'product'
            },
          },
          {
            $project: {
              item: 1, quantity: 1, product: {
                $arrayElemAt: ['$product', 0]
              }
            }
          }
        ]).toArray();
        if (cartItems.length > 0) {
          console.log(cartItems[0].product)
          resolve(cartItems);
        } else {
          resolve([]);
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0
      let cart = await db.get().collection(collection.Cart_Collection).findOne({ user: new ObjectId(userId) })
      if (cart) {
        count = cart.products.length
      }
      resolve(count)
    })
  },

  changeQuantity: (details) => {
    details.count = parseInt(details.count)
    details.quantity = parseInt(details.quantity)
    return new Promise((resolve, reject) => {
      if (details.count === -1 && details.quantity === 1) { // Updated condition
        db.get().collection(collection.Cart_Collection)
          .updateOne({ _id: new ObjectId(details.cart) }, {
            $pull: { products: { item: new ObjectId(details.product) } }
          }).then((response) => {
            console.log(response)
            resolve({ removeProduct: true });
          });
      } else {

        db.get().collection(collection.Cart_Collection)
          .updateOne(
            { _id: new ObjectId(details.cart), 'products.item': new ObjectId(details.product) },
            { $inc: { 'products.$.quantity': details.count } }
          ).then((response) => {
            console.log(response)
            resolve({ status: true });
          });
      }
    });
  },
  deleteCartQuantity: async (proId) => {
    console.log(proId)
    return new Promise((resolve, reject) => {
      db.get().collection(collection.Cart_Collection).updateOne(
        { products: { $elemMatch: { item: new ObjectId(proId) } } },
        { $pull: { products: { item: new ObjectId(proId) } } }
      )
        .then((response) => {
          console.log(response);
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let userCart = await db.get().collection(collection.Cart_Collection).findOne({ user: new ObjectId(userId) })
      if (userCart) {
        let total = await db.get().collection(collection.Cart_Collection).aggregate([
          {
            $match: { user: new ObjectId(userId) }
          },
          {
            $unwind: '$products'
          },
          {
            $project: {
              item: '$products.item',
              quantity: '$products.quantity'
            }
          },
          {
            $lookup: {
              from: collection.PRODUCT,
              localField: 'item',
              foreignField: '_id',
              as: 'product'
            }
          }, {
            $project: {
              item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.Price' }] } }
            }
          }
        ]).toArray()
        if (total[0]) {
          resolve(total[0].total)
        } else {
          let total = 0
          resolve(total)
        }
      } else {
        let total = 0
        resolve(total)
      }
    })
  },
  PlaceOrder: (order, product, total) => {
    return new Promise(async (resolve, reject) => {
      let status = order['payment-method'] === "COD" ? 'placed' : 'pending'
      let OrderObj = {
        DeliveryDetails: {
          address: order.address,
          mobile: order.mobile,
          Pincode: order.pincode
        },
        date: new Date(),
        Product: product,
        total: total,
        userId: order.userId,
        paymentstatus: status,
        paymentmethod: order['payment-method']
      }
      db.get().collection(collection.Order_collection).insertOne(OrderObj).then((response) => {

        resolve(response.insertedId.toString())
      })

    })
  },
  getCartProductList: (userId) => {

    return new Promise(async (resolve, reject) => {
      let cart = await db.get().collection(collection.Cart_Collection).findOne({ user: new ObjectId(userId) })

      resolve(cart.products)
    })
  },
  getUserOrder: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const orders = await db
          .get()
          .collection(collection.Order_collection)
          .find({ userId: userId })
          .toArray();
        resolve(orders);
      } catch (error) {
        reject(error);
      }
    });
  },
  getOrderProducts: (orderId) => {
    console.log(orderId)
    return new Promise(async (resolve, reject) => {
      try {
        let OrderItems = db.get().collection(collection.Order_collection).aggregate([
          {
            $match: {
              user: new ObjectId(orderId)
            }
          },
          {
            $unwind: '$product'
          },
          {
            $project: {
              item: '$product.item',
              quantity: '$product.quantity'
            }
          },
          {
            $lookup: {
              from: collection.PRODUCT,
              localField: 'item',
              foreignField: '_id',
              as: 'order'
            }
          },
          {
            $project: {
              item: 1, quantity: 1, order: { $arrayElemAt: ['$order', 0] }
            }
          },

        ]).toArray()
        resolve(OrderItems)


      }
      catch (err) {
        console.log(err)
        reject(err)
      }
    })
  },
  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: total,
        currency: "INR",
        receipt: "" + orderId
      };
      instances.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("order:", order);
          resolve(order)
        }
      });
    })
  },
  verifyPayment: (order) => {
    return new Promise((resolve, reject) => {
      let hmac = crypto.createHmac('sha256', process.env.key_secret);
      hmac.update(order['payment[razorpay_order_id]'] + '|' + order['payment[razorpay_payment_id]']);
      hmac = hmac.digest('hex');
      if (hmac === order['payment[razorpay_signature]']) {
        resolve();
      } else {
        reject(new Error('HMAC verification failed'));
      }
    });
  },
  
  
  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collection.Order_collection).updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            status: "confirmed"
          }
        },
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  }
  
}

