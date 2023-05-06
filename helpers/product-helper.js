var db=require('../config/mongo connection');
var collection=require('../config/collection');


module.exports ={
  addProduct:(product,callback)=>{
    console.log(product)
    db.get().collection('product').insertOne(product).then((data)=>{
      console.log(data)
      callback(data.insertedId);
    })

    },
    getAllProduct:()=>{
      return new Promise(async (resolve,reject)=>{
        let product=await db.get().collection(collection.PRODUCT).find().toArray()
        resolve(product)
      })
    }

  }
