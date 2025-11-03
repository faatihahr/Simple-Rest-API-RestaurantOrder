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
});
