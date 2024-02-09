const mongoose = require("mongoose");

const ticketSchema = mongoose.Schema({
  wallet_id: { type: Number, required: true },
  ticket_id: { type: Number},
  time_after: { type: String },
  station_from: { type: Number},
  station_to: { type: Number },
  balance: { type: Number },
  stations: {type: Array}
});

module.exports  = mongoose.model("Tickets", ticketSchema);
