const mongoose = require("mongoose");

const ticketSchema = mongoose.Schema({
  wallet_id: { type: Number, required: true },
  time_after: { type: String, required: true },
  station_from: { type: Number, required: true },
  station_to: { type: Number, required: true }
});

module.exports  = mongoose.model("Tickets", ticketSchema);
