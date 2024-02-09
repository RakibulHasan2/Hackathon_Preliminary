const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const users = require("./models/userModel");
const station = require("./models/stationModel");
const trains = require("./models/trainModels");
const tickets = require("./models/ticketModel");

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

// get Users
app.get("/api/users", async (req, res) => {
  const result = await users.find({})
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
  trainData.stops.sort((a, b) => a.fare - b.fare);
  const stopsArray = trainData.stops;
  const arrival_time = stopsArray[0].departure_time;
  const departure_time = stopsArray[stopsArray.length - 1].arrival_time;

  const trainDataModified = {
    train_id: trainData.train_id,
    train_name: trainData.train_name,
    capacity: trainData.capacity,
    service_start: arrival_time,
    service_ends: departure_time,
    num_stations: trainData.stops.length
  }
  const trainDataSaved = {
    train_id: trainData.train_id,
    train_name: trainData.train_name,
    capacity: trainData.capacity,
    service_start: arrival_time,
    service_ends: departure_time,
    num_stations: trainData.stops.length,
    stops: trainData.stops
  }
  await trains.create(trainDataSaved);

  res.status(201).json(trainDataModified);
});

// get train by stations
app.get("/api/stations/:id/trains", async (req, res) => {
  const stationID = req.params.id;
  const allTrains = await trains.find({});
  const allStation = (input) => {
    const result = [];
    input.forEach(train => {
      train.stops.forEach(stop => {
        const existingStation = result.find(station => station.station_id === stop.station_id);

        if (existingStation) {
          existingStation.trains.push({
            "train_id": train.train_id,
            "arrival_time": stop.arrival_time,
            "departure_time": stop.departure_time
          });
        } else {
          result.push({
            "station_id": stop.station_id,
            "trains": [
              {
                "train_id": train.train_id,
                "arrival_time": stop.arrival_time,
                "departure_time": stop.departure_time
              }
            ]
          });
        }
      });
    });
    return result;
  };

  // console.log("all station", allStation(allTrains))
  const allStationArray = allStation(allTrains);
  const stationByID = allStationArray.filter(station => station.station_id == stationID);
  if(stationByID.length > 0) {
    res.status(200).json(stationByID);
  }else{
    res.status(404).json({message: `station with id: ${stationID} was not found`});
  }
});

// get all stations
app.get("/api/stations", async (req, res) => {
  const result = await station.find({})
  res.status(200).json({ "stations": result });
});

// get 
app.get("/api/stations/:id", async (req, res) => {
  const stationId = req.params.id;
  const result = await trains.find({ station_id: stationId })
  res.status(200).json({ "station_id": stationId, "trains": result });
});

// get wallet by id
app.get("/api/wallets/:id", async (req, res) => {
  const wallet_id = req.params.id;
  const result = await users.findOne({ user_id: wallet_id })
  if (result) {
    const walletData = {
      wallet_id: wallet_id,
      wallet_balance: result.balance,
      wallet_user: {
        user_id: result.user_id,
        user_name: result.user_name
      }
    }
    return res.status(200).json(walletData);
  }
  else {
    return res.status(404).send({ message: `wallet with id: ${wallet_id} was not found` });
  }
});

//update wallet by id
app.put("/api/wallets/:id", async (req, res) => {
  const id = req.params.id;
  const payload = req.body;
  if (payload.recharge >= 100 && payload.recharge <= 10000) {
    const user = await users.findOne({ user_id: id });
    const newBalance = payload.recharge + user.balance;
    if (user) {
      const walletData = {
        wallet_id: id,
        wallet_balance: newBalance,
        wallet_user: {
          user_id: user.user_id,
          user_name: user.user_name
        }
      }
      await users.findOneAndUpdate({ user_id: id }, { balance: newBalance });
      return res.status(200).json(walletData);
    }
    else {
      return res.status(404).send({ message: `wallet with id: ${wallet_id} was not found` });
    }
  } else {
    return res.status(404).send({ message: `invalid amount : ${payload.recharge}` });
  }

});

// create tickets
app.post("/api/tickets", async (req, res) => {
  const ticketData = req.body;
  const result = await tickets.create(ticketData)
  res.send(result);
});


app.get('/', (req, res) => {
  res.send("Database Connected")
})


app.listen(8000, () => {
  console.log("Server running on port 8000");
});
