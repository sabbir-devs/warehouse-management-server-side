// extarnal imports
const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


// internal imports
const productRoutes = require('./routes/product.route');
const verifyJWT = require("./utiliti/verifyJWT");

app.use(cors());
app.use(express.json());

// app.use("/product", productRoutes)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yms1t.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// check my new branch

// verifyJWT
// function verifyJWT(req, res, next) {
//   const autHeader = req.headers.authorization;
//   if (!autHeader) {
//     return res.status(401).send({ message: "UnAuthorized access" });
//   }
//   const token = autHeader.split(" ")[1];
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
//     if (err) {
//       return res.status(403).send({ message: "Forbidden access" });
//     }
//     req.decoded = decoded;
//     next();
//   });
// }

async function run() {
  try {
    client.connect();
    const productCollection = client.db("manufacturer").collection("product");
    const orderCollection = client.db("manufacturer").collection("orders");
    const reviewCollection = client.db("manufacturer").collection("review");
    const userCollection = client.db("manufacturer").collection("user");
    const paymentCollection = client.db("manufacturer").collection("payment");


    // Admin verification 
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        next();
      }
      else {
        res.status(403).send({ message: 'forbidden' });
      }
    }

    // payment
    app.post('/create-payment-intent', verifyJWT, async(req, res) =>{
      const product = req.body;
      const price = product.price;
      const amount = price*100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount : amount,
        currency: 'usd',
        payment_method_types:['card']
      });
      res.send({clientSecret: paymentIntent.client_secret})
    });


    app.get("/product", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // single product
    app.get("/seeDetails/:id",verifyJWT, async (req, res) => {
      const id = req.params.id;
      const quary = { _id: ObjectId(id) };
      const result = await productCollection.findOne(quary);
      res.send(result);
    });

    // add product
    app.post("/product", verifyJWT, async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    });

    // delete product
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    // order product
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });
    // all oders
    app.get("/orders",verifyJWT, async (req, res) => {
      const result = await orderCollection.find().toArray();
      res.send(result);
    });

    // My ordrs
    app.get("/myOrders", verifyJWT, async (req, res) => {
      const customerEmail = req.query.customerEmail;
      const decodeEmail = req.decoded.email;
      if (customerEmail === decodeEmail) {
        const query = { customerEmail: customerEmail };
        const order = await orderCollection.find(query).toArray();
        return res.send(order);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    });

    // get single orders by id
    app.get('/orders/:id', verifyJWT, async(req, res) => {
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await orderCollection.findOne(query)
      res.send(result)
    })

    // update orders payment
    app.patch('/orders/:id', verifyJWT, async(req, res) => {
      const id = req.params.id;
      const payment = req.body
      const filter = {_id: ObjectId(id)};
      const updateDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId
        },
      };
      const result = await paymentCollection.insertOne(payment)
      const updatedOrder = await orderCollection.updateOne(filter, updateDoc);
      res.send(updatedOrder)
    })

    // update orders delifered confirmation
    app.patch('/ordersDeliver/:id', verifyJWT, async(req, res) => {
      const id = req.params.id;
      const payment = req.body
      const filter = {_id: ObjectId(id)};
      const updateDoc = {
        $set: {
          deliver: true,
        },
      };
      const result = await paymentCollection.insertOne(payment)
      const updatedOrder = await orderCollection.updateOne(filter, updateDoc);
      res.send(updatedOrder)
    })

    // delete orders
    app.delete("/myOrders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    // add review
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    // get all reviews
    app.get("/reviews", async (req, res) => {
      const query = {};
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    });

    // add user from login
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });

    // get all user
    app.get("/user", verifyJWT, async (req, res) => {
      const query = {};
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });

    // make user admin
    app.put("/user/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccout = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccout.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        return res.send(result);
      } else {
        res.status(403).send({ message: "forbiden access" });
      }
    });

    // is user is admin?
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    // get user by filter email
    app.get("/user", async (req, res) => {
      const email = req.headers.email;
      const user = await userCollection.findOne({ email: email });
      res.send(user);
    });
    app.get("/users", async (req, res) => {
      const email = req.headers.email;
      const user = await userCollection.findOne({ email: email });
      res.send(user);
    });
    // update user by email
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello from manufacturer server");
});

app.all("*",(req,res) => {
  res.send("No Route Found")
})

app.listen(port, () => {
  console.log("manufacturer is running on port", port);
});
