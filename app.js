const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const users = require("./models/userModel");
const station = require("./models/stationModel");
const trains = require("./models/trainModels");

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


// create Users
app.post("/api/users", async (req, res) => {
  const userData = req.body;
  const result = await users.create(userData)
  res.send(result);
});

// create Stations
app.post("/api/stations", async (req, res) => {
  const stationData = req.body;
  const result = await station.create(stationData)
  res.send(result);
});


// create trains
app.post("/api/trains", async (req, res) => {
  const trainData = req.body;
  let lowestArrivalTime  = null;
  let highestDepartureTime = null;
  // Iterate through the stops array to find the earliest arrival time and latest departure time
  trainData.stops.forEach(stop => {
    if (stop.arrival_time && (!lowestArrivalTime || stop.arrival_time < lowestArrivalTime)) {
      lowestArrivalTime = stop.arrival_time;
    }
    if (stop.departure_time && (!highestDepartureTime || stop.departure_time > highestDepartureTime)) {
      highestDepartureTime = stop.departure_time;
    }
  });

  const trainDataModified = {
    train_id: trainData.train_id,
    train_name: trainData.train_name,
    capacity: trainData.capacity,
    service_start: lowestArrivalTime || highestDepartureTime,
    service_ends: highestDepartureTime || lowestArrivalTime,
    num_stations: trainData.stops.length
  }
  const result = await trains.create(trainDataModified)
  res.status(201).json(result);
});

// get all stations
app.get("/api/stations", async (req, res) => {
  const result = await station.find({})
  res.status(200).json({"stations":result});
});

// get all trains
app.get("/api/stations/:id/trains", async (req, res) => {
  const stationId = req.params.id;
  const result = await trains.find({})
  res.status(200).json({"station_id": stationId,"trains":result});
});


app.get('/', (req, res) => {
  res.send("Database Connected")
})


app.listen(8000, () => {
  console.log("Server running on port 8000");
});
