import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({path : './env'});

connectDB()
.then(() => {
    app.listen(process.env.PORT || 3000 , () => {
        console.log(`server running at port ${process.env.PORT}`);
    })

    app.on("error", (error) => {
        console.log("APP LISTENING ERROR : ", error);
        throw error;
    })
})
.catch((err) => {
    console.log('MongoDB connection failed : ' , err);
});


/*
approach 1:

import express from "express"
cosnt app = express()

//iffy, executes immedietly, semicolon for cleaning purposes(not mandatory)
;( async () => {
    try{

        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERR : ", error);
            throw error;
        })
    } catch(error){

        console.log("ERROR :", error);

    }
})()
*/