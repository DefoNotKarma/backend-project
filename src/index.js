import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({path : './env'});

connectDB()


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