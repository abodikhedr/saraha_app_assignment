import mongoose from 'mongoose';
import { DB_URI, PORT } from '../../config/config.service.js';



const connectionDB = async () => {
    try {
        await mongoose.connect(DB_URI,{
            serverSelectionTimeoutMS:5000
        });
        console.log("database connected successfuly");
        
    } catch (error) {
        console.log("database failed to connect");
        
    }
}


export default connectionDB







