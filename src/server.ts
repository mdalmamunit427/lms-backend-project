import {v2 as cloudinary} from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import config from './config';
import dbConnect from './utils/db';

cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});


app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  dbConnect();
});


