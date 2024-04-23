import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
import { asyncHandler } from "./asyncHandler";

          
cloudinary.config({ 

  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET

});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) 
            return null;

        // upload on cloudinary
        const response = await cloudinary.uploader.upload(
            localFilePath, {
            resource_type : "auto"
        });
        
        // file has been uploaded
        console.log("file has been uploaded on cloudinary : ", response.url);

        fs.unlinkSync(localFilePath);

        return response;

    } catch (error) {
        console.error("upload error : ", error)
        fs.unlinkSync(localFilePath);
        // removes the locally saved temp file in server
        return null;
    }
};

const deleteSingleFileFromCloudinary = async (cloudFilePath) => {
    try {
        if (!cloudFilePath){
            return null;
        }
        
        await cloudinary.uploader.destroy(
            cloudFilePath,
            { resource_type : "auto"}
        )
    
        console.log("deleted from cloudinary : ", cloudFilePath);
    } catch (error) {
        console.error("Cloudinary Deletion Error : ", error)
        return null;
    }
};


export {
    uploadOnCloudinary,
    deleteSingleFileFromCloudinary
} 
  