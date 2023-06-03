const db = require("../config/mongo connection")
const collection = require("../config/collection")
const bcrypt = require("bcrypt")
const mailer = require('nodemailer')
require("dotenv").config()
const crypto = require("crypto")
const { token } = require("morgan")
const { ObjectId } = require("mongodb");
const { response } = require("express")


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

      const user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })

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
        { Email: email },
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
        console.log(password)
        console.log(userId)
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
        let productExist = userCart.products.find(product => product.item== proId)
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

}  