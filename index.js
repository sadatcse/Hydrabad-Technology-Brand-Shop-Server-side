//Header area
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express =require('express');
const cors = require('cors');
const app= express();
const port =process.env.PORT ||5000;
require('dotenv').config()
const uri = `mongodb+srv://${process.env.M_U}:${process.env.SECRET_KEY}@cluster0.pivlv54.mongodb.net/?retryWrites=true&w=majority`;


// middleware 
app.use(cors());
app.use(express.json());


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  if (client && client.topology && client.topology.s.state === 2) {
    console.log("Already connected to MongoDB!");
  } else {
    // Connect the client to the server if not already connected
    await client.connect();
    console.log("Connected to MongoDB!");
  }

  const userCollection = client.db('Techno').collection('user');
  const productCollection = client.db('Techno').collection('products');

  app.get('/product', async (req, res) => {
    const cursor = productCollection.find();
    const products = await cursor.toArray();
    res.send(products);
  });

  app.get('/product/category/:category', async (req, res) => {
    const requestedCategory = req.params.category;
      const cursor = productCollection.find({ category: requestedCategory });
      const products = await cursor.toArray();
      res.send(products);
  });

  app.get('/product/brand/:brand', async (req, res) => {
    const requestedBrand = req.params.brand;
      const cursor = productCollection.find({ Brand: requestedBrand });
      const products = await cursor.toArray();
      res.send(products);
  });

  app.get('/product/:brand/:category', async (req, res) => {
    const requestedBrand = req.params.brand;
    const requestedCategory = req.params.category;
    const cursor = productCollection.find({ Brand: requestedBrand, category: requestedCategory });
      const products = await cursor.toArray();
      res.send(products);
  });

  app.get('/product/:product_id', async (req, res) => {
    const requestedProductID = req.params.product_id;
    const cursor = productCollection.find({ product_id: requestedProductID });
    const product = await cursor.toArray();

    if (product.length === 0) {
        res.status(404).json({ message: 'Product not found' });
    } else {
        res.send(product);
    }
});

  app.post('/product', async (req, res) => {
    const products = req.body;
    console.log(products);
    const result = await productCollection.insertOne(products);
    res.send(result);
});


  app.get('/user', async (req, res) => {
    const cursor = userCollection.find();
    const users = await cursor.toArray();
    res.send(users);
  });


  app.post('/user', async (req, res) => {
    const user = req.body;
    console.log(user);
    const result = await userCollection.insertOne(user);
    res.send(result);
});

  app.get('/', (req, res) => {
    res.send('Blank Page');
  });
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on Port:${port}`);
});


