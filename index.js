const express = require("express");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
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
