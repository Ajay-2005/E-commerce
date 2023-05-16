const db=require("../config/mongo connection")
const collection=require("../config/collection")
const bcrypt=require("bcrypt")
module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
           if(!userData.Password || userData.Password.trim()===""){
                reject (new Error('Password field is requird'))
                return;
            } 
            try{
                userData.Password=await bcrypt.hash(userData.Password,10)
                const data=await db.get().collection(collection.USER_COLLECTION).insertOne(userData)
                resolve(data)
            }
            catch(err){
                reject(err)
            }
        })
    }
}