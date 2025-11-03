<<<<<<< HEAD
import express from 'express';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
=======
import express from "express";
import router from  "./routes/post-routes.js";

const app = express();
const port = 3000;

// Middleware for parsing JSON bodies
app.use(express.json());


app.get("/", (req, res) => {
  res.redirect("/api/v1");
});

app.use("/api/v1", router);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
>>>>>>> 9cd9e7c487cbdb856545c5fbde61e2818178dd07
});
