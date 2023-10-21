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

  // Import mongo Db Base 

  const userCollection = client.db('Techno').collection('user');
  const productCollection = client.db('Techno').collection('protech');
  const productcart = client.db('Techno').collection('carts');
  const brandcollection = client.db('Techno').collection('brandstec');


//------------------------------------------------Add to Cart all  ------------------------------------------------


  app.get('/cart', async (req, res) => {
    const cursor = productcart.find();
    const brands = await cursor.toArray();
    res.send(brands);
  });

  app.post('/cart', async (req, res) => {
    const products = req.body;
    const userEmail = products.userEmail;
    const cartProduct = products.cart[0]; 
    let result; 
    const existingCart = await productcart.findOne({ userEmail: userEmail }); 
    if (existingCart) {
        const existingProduct = existingCart.cart.find(product => product.productId === cartProduct.productId);
        if (existingProduct) {
            existingProduct.quantity++;
        } else {
            existingCart.cart.push(cartProduct);
        }
        result = await productcart.updateOne({ userEmail: userEmail }, { $set: { cart: existingCart.cart } }); 
    } else {
        const newCart = {
            userEmail: userEmail, 
            cart: [cartProduct]
        };
        result = await productcart.insertOne(newCart);
    }

    res.send(result);
});

app.post('/cart/delete', async (req, res) => {
  const { userEmail, productId } = req.body;
  console.log('Received request with userEmail:', userEmail, 'and productId:', productId);

  try {
    const existingCart = await productcart.findOne({ userEmail: userEmail });
    console.log('Existing Cart:', existingCart);

    if (existingCart) {
      const productIndex = existingCart.cart.findIndex(
        (product) => product.productId === productId
      );
      console.log('Product Index:', productIndex);

      if (productIndex !== -1) {
        existingCart.cart.splice(productIndex, 1);

        const result = await productcart.updateOne(
          { userEmail: userEmail },
          { $set: { cart: existingCart.cart } }
        );
        console.log('Update Result:', result);

        if (result.modifiedCount > 0) {
  
          console.log('Product successfully removed from the cart');
          return res.json({ success: true });
        } else {
          console.log('Failed to remove product from cart');
          return res.json({ success: false, message: 'Failed to remove product from cart' });
        }
      } else {
        console.log('Product not found in cart');
        return res.json({ success: false, message: 'Product not found in cart' });
      }
    } else {
      console.log("User's cart not found");
      return res.json({ success: false, message: "User's cart not found" });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});



// app.get('/cart/search/:userEmail', async (req, res) => {
//   const userEmail = req.params.userEmail;

//   try {
//     const userCart = await productcart.findOne({ userEmail }); 
//     if (!userCart) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.json(userCart.cart); 
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// app.delete('/cart/:id', async (req, res) => {
//   const id = req.params.id;
//   const query = { _id: new ObjectId(id) }
//   const result = await productcart.deleteOne(query);
//   res.send(result);
// })


//only Get Brands 


  app.get('/brands', async (req, res) => {
    const cursor = brandcollection.find();
    const brands = await cursor.toArray();
    res.send(brands);
  });

  app.get('/brands/:brand', async (req, res) => {
    const requestedBrand = req.params.brand;
      const cursor = brandcollection.find({ BrandName: requestedBrand });
      const products = await cursor.toArray();
      res.send(products);
  });

// -------------------------------Product Related Data --------------------------------------------------

  //get all Product  

  app.get('/product', async (req, res) => {
    const cursor = productCollection.find();
    const products = await cursor.toArray();
    res.send(products);
  });

  //get Product by category

  app.get('/product/category/:category', async (req, res) => {
    const requestedCategory = req.params.category;
      const cursor = productCollection.find({ category: requestedCategory });
      const products = await cursor.toArray();
      res.send(products);
  });

    //get Product by Brand


  app.get('/product/brand/:brand', async (req, res) => {
    const requestedBrand = req.params.brand;
      const cursor = productCollection.find({ Brand: requestedBrand });
      const products = await cursor.toArray();
      res.send(products);
  });

 // get product by brand and catagorie [http://localhost:5000/product/search/apple/Mobile]

  app.get('/product/search/:brand/:category', async (req, res) => {
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
        res.status(404).json({ message: `${requestedProductID} Product not found` });
    } else {
        res.send(product);
    }
});

app.get('/products/id/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await productCollection.findOne(query);
  res.send(result);
})

app.put('/products/id/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) }; 
    const updatedProduct = req.body;
    console.log(updatedProduct);

    const result = await productCollection.updateOne(filter, { $set: updatedProduct }); 
    if (result.matchedCount === 0) {
      res.status(404).json({ message: 'Product not found' });
    } else {
      res.json({ message: 'Product updated successfully' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

  // All post  method 





app.put('/updatep/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const options = { upsert: true };
  const updatedproduct = req.body;
  console.log(updatedproduct);

  const result = await productCollection.updateOne(filter, updatedproduct, options);
  res.send(result);
})

app.post('/product', async (req, res) => {
  const products = req.body;
  console.log(products);
  const result = await productCollection.insertOne(products);
  res.send(result);
});


//User area
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


