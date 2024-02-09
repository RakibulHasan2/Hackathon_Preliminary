const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  user_id: { type: Number, required: true },
  user_name: { type: String, required: true },
  balance: { type: Number, required: true }
});

module.exports  = mongoose.model("Users", userSchema);
