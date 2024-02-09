const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

// Loading environment variables from .env file
require('dotenv').config();


// url
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xgyce0q.mongodb.net/?retryWrites=true&w=majority`;

// database configuration
mongoose
  .connect(url)
  .then(() => {
    console.log("Connected to database!");
  })
  .catch((error) => {
    console.log("Connection failed!", error);
    process.exit();
  });


// Creating Express application instance
const app = express();


//middleware
app.use(bodyParser.json());
app.use(cors());


app.get('/', (req, res) => {
  res.send("Database Connected")
})


app.listen(8000, () => {
    console.log("Server running on port 8000");
  });
  