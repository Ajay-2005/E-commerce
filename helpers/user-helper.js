const db = require("../config/mongo connection")
const collection = require("../config/collection")
const bcrypt = require("bcrypt")
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
        return new Promise(async (resolve, reject) =>{
            
            let response = {}

            const user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            
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
            else{
                console.log("user not found")
                resolve({status:false})
            } 
})
    }
}
