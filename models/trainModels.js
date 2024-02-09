const mongoose = require("mongoose");

// const StopSchema = new mongoose.Schema({
//     station_id: {
//         type: Number,
//     },
//     arrival_time: {
//         type: String,
//     },
//     departure_time: {
//         type: String,
//     },
//     fare: {
//         type: Number,
//     }
// });

const trainSchema = mongoose.Schema({
    train_id: { type: Number, required: true },
    train_name: { type: String, required: true },
    capacity: { type: Number, required: true },
    service_start: {
        type: String
    },
    service_ends: {
        type: String
    },
    num_stations:{
    type: Number
    }
});



module.exports = mongoose.model("Train", trainSchema);

