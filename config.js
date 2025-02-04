const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE_URL,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then( () => {
    console.log("DB connection is established successful..🚀");
}).catch( (e) => {
    console.log("DB connection not established ❌");
});