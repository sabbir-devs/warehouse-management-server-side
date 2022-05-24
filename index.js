const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yms1t.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    client.connect();
    const productCollection = client.db("manufacturer").collection("product");
    const orderCollection = client.db("manufacturer").collection("orders");
    const reviewCollection = client.db("manufacturer").collection("review");
    const userCollection = client.db("manufacturer").collection("user");

    app.get('/product', async(req, res) => {
      const query = {};
      const cursor = productCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })
    // single product
    app.get('/seeDetails/:id', async(req, res) => {
      const id = req.params.id;
      const quary = {_id: ObjectId(id)};
      const result = await productCollection.findOne(quary);
      res.send(result)
    })
    // order product
    app.post('/orders', async(req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order)
      res.send(result)
    })
    // all roders
    app.get('/orders', async(req, res) => {
      const result = await orderCollection.find().toArray();
      res.send(result)
    })

    // My ordrs
    app.get('/myOrders', async(req, res) => {
      const customerEmail = req.query.customerEmail;
      console.log('customer email', customerEmail)
      const authorization = req.headers.authorization;
      console.log('auth header', authorization)
      const query = {customerEmail: customerEmail}
      const result = await orderCollection.find(query).toArray();
      res.send(result)
      
    })

    // delete orders
    app.delete('/myOrders/:id', async(req, res) => {
      const id = req.params.id
      const query = {_id: ObjectId(id)}
      const result = await orderCollection.deleteOne(query)
      res.send(result)
    })

    
    // add review 
    app.post('/reviews', async(req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review)
      res.send(result)
    })
    // get all reviews 
    app.get('/reviews', async(req,res) => {
      const query = {};
      const result = await reviewCollection.find(query).toArray()
      res.send(result)
    })

    // add user 
    app.put('/user/:email', async(req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = {email: email};
      const options = {upsert: true};
      const updateDoc = {
        $set: user,
      }
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({result, token})
    })




  } finally {

  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello from manufacturer server");
});

app.listen(port, () => {
  console.log("manufacturer is running on port", port);
});
