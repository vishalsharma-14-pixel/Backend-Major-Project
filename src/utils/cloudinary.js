import {v2 as cloudinary} from "cloudinary"
import { response } from "express";
import fs from "fs"
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath)  return null;

        const response= await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        //console.log("File is uploaded on cloudinary",response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        console.error("Cloudinary Upload Error:", error.message);

        fs.unlinkSync(localFilePath) // remove the locally saved temp file as the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary}