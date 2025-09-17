import {v2 as cloudinary} from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import config from './config';
import mongoose from 'mongoose';

cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

async function main() {
  await mongoose.connect(config.database_url as string);
  
  app.listen(config.port, () => {
      console.log(`Example app listening on port ${config.port}`)
    })

}

main().then(() => console.log("Mongodb is connected successfully!"))
.catch(error => console.log(error));

