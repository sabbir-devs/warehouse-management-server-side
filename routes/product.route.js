const express = require("express");
const verifyJWT = require("../utiliti/verifyJWT");

const router = express.Router();




router.get("/product", async (req, res) => {
  const query = {};
  const cursor = productCollection.find(query);
  const result = await cursor.toArray();
  res.send(result);
});

// single product
router.get("/seeDetails/:id", verifyJWT, async (req, res) => {
  const id = req.params.id;
  const quary = { _id: ObjectId(id) };
  const result = await productCollection.findOne(quary);
  res.send(result);
});

// add product
router.post("/product", verifyJWT, async (req, res) => {
  const product = req.body;
  const result = await productCollection.insertOne(product);
  res.send(result);
});

// delete product
router.delete("/product/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: ObjectId(id) };
  const result = await productCollection.deleteOne(query);
  res.send(result);
});

// export all routs
module.exports = router;
