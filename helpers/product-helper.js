var db = require('../config/mongo connection');
var collection = require('../config/collection');

const { ObjectId } = require("mongodb");


module.exports = {
  addProduct: (product, callback) => {
    console.log(product)
    db.get().collection('product').insertOne(product).then((data) => {
      console.log(data)
      callback(data.insertedId);
    })

  },
  getAllProduct: () => {
    return new Promise(async (resolve, reject) => {
      let product = await db.get().collection(collection.PRODUCT).find().toArray()
      resolve(product)
    })
  },
  deleteProduct: (productId) => {
    return new Promise((resolve, reject) => {

      db.get()
        .collection(collection.PRODUCT)
        .deleteOne({
          _id: new ObjectId(productId)
        })
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },
  
getProductByName: (productName) => {
    return new Promise(async (resolve, reject) => {
      let product = await db
        .get()
        .collection(collection.PRODUCT)
        .findOne({name: productName });
      resolve(product);
    });
  },
  getSimilarProducts: (productName) => {
    return new Promise(async (resolve, reject) => {
      try {
        const product = await db
          .get()
          .collection(collection.PRODUCT)
          .findOne({ name: productName });

        if (!product) {
          throw new Error('Product not found');
        }

        const similarProducts = await db
          .get()
          .collection(collection.PRODUCT)
          .aggregate([
            { $match: { name: { $ne: productName } } },
            { $limit: 6}, // Limit the number of similar products to display
          ])
          .toArray();

        resolve(similarProducts);
      } catch (error) {
        reject(error);
      }
    });
  },
};

    







