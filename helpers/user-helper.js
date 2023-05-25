const db = require("../config/mongo connection")
const collection = require("../config/collection")
const bcrypt = require("bcrypt")
const mailer = require('nodemailer')
require("dotenv").config()
const crypto = require("crypto")
const { token } = require("morgan")
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
      console.log(result)
      if (result !== null && result.value) {
        return result.value;
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      if (error.message === 'User not found') {
        return null; // or return an empty object: {}
      } else {
        console.error(error);
        throw error;
      }
    }
  },


  

  sendPasswordResetEmail :async (email, resetLink) => {
    try {
      const transporter = mailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: process.env.Email,
          pass: process.env.Password
        }
      });
  
      const mailOptions = {
        from: process.env.Email,
        to: email,
        subject: 'Password Reset',
        text: `Please click the following link to reset your password: ${resetLink}`
      };
  
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
  
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
    