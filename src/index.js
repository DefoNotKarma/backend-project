import mongoose from "mongoose";
import { DB_NAME } from "./constants";


//iffy, executes immedietly, semicolon for cleaning purposes(not mandatory)
;( async () => {
    try{

        mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)

    } catch(error){

        console.log("ERROR :", error);

    }
})()
