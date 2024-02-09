const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const users = require("./models/userModel");
const station = require("./models/stationModel");
const trains = require("./models/trainModels");
const tickets = require("./models/ticketModel");
const geolib = require("geolib");
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
  if (stationByID.length > 0) {
    res.status(200).json(stationByID);
  } else {
    res.status(404).json({ message: `station with id: ${stationID} was not found` });
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
  const stationFrom = ticketData.station_from;
  const stationTo = ticketData.station_to;
  const user = await users.findOne({ user_id: ticketData.wallet_id });
  let getStation = [];
  const allTrain = await trains.find({})
  for (let i = 0; i < allTrain.length; i++) {
    const element = allTrain[i];
    const stops = element.stops;
    let fromFlag = 0;
    let toFlag = 0;
    let toStopObject = {};
    let forStopObject = {};

    for (let j = 0; j < stops.length; j++) {
      if (stationFrom == stops[j].station_id && stops[j].departure_time > ticketData.time_after) {
        fromFlag = 1;
        forStopObject = stops[j]
        getStation.push(forStopObject);
      }
      if (stationTo == stops[j].station_id && stops[j].departure_time > ticketData.time_after) {
        toFlag = 1;
        toStopObject = stops[j];
        getStation.push(toStopObject);
      }
    }
    if (toFlag == 0 && fromFlag == 0) {
      getStation = [];
    }
  }
  if (getStation.length == 0) {
    return res.status(404).send({ message: `no ticket available for station: ${ticketData.station_from} to station: ${ticketData.station_to}` });
  }
  const min = 1;
  const max = 10000;
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
  const gettingBalance = user.balance;
  if (gettingBalance < getStation[getStation.length - 1].fare) {
    return res.status(404).send({ message: `recharge amount: ${getStation[getStation.length - 1].fare - gettingBalance} to purchase the ticket` });
  }
  const newBalance = gettingBalance - getStation[getStation.length - 1].fare;
  await users.findOneAndUpdate({ user_id: ticketData.wallet_id }, { balance: newBalance });
  const responseObject = {
    ticket_id: randomNum,
    balance: user.balance,
    wallet_id: ticketData.wallet_id,
    stations: getStation
  }
  await tickets.create(responseObject)
  res.status(201).json(responseObject);
});

app.get("/api/routes", async (req, res) => {
  const { from, to, optimize } = req.query;
  const optimizations = optimize ? optimize : "time";
  const localStation = await station.find({});
  console.log("local station", localStation);
  if (!from && !to) {
    return res.status(403).json({
      message: `no routes available from station: ${from} to station:
    ${to}`
    });
  }
  const fromStation = localStation.find((station) => station.station_id == from);
  const toStation = localStation.find((station) => station.station_id == to);
  console.log(fromStation, toStation);

  if (!fromStation || !toStation) {
    return res.status(403).json({
      message: `no routes available from station: ${from} to station:
    ${to}`
    });
  }

  if (optimizations) {
    const distance = geolib.getDistance(
      { latitude: fromStation.latitude, longitude: fromStation.longitude },
      { latitude: toStation.latitude, longitude: toStation.longitude }
    );
    res.status(200).json({
      message: "API called successfully",
      from: fromStation,
      to: toStation,
      distance,
      total_cost: toStation.fare + fromStation.fare,
      total_time: "",
      stations: localStation
    });
  }
});


app.get('/', (req, res) => {
  res.send("Database Connected")
})


app.listen(8000, () => {
  console.log("Server running on port 8000");
});
