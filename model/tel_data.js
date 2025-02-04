const mongoose = require('mongoose');

   const TleSchema = new mongoose.Schema({
            name:{
                type: String,
            },
            tleLine1:{
                type: String,
            },
            tleLine2:{
                type: String,
            },
            
        });

const Tle = mongoose.model('TleSchema', TleSchema);


module.exports = Tle;
