const mongoose = require("mongoose");

const stationSchema = mongoose.Schema({
  station_id: { type: Number, required: true },
  station_name: { type: String, required: true },
  longitude: { type: Number, required: true },
  latitude: { type: Number, required: true }
});

module.exports  = mongoose.model("Station", stationSchema);
