import mongoose from "mongoose";
mongoose.set('strictQuery',false); // if we ask for extra info that u don't have then don't give error
const connectionToDB =async()=>{
    try{
  const {connection}=await  mongoose.connect(
        process.env.MONGODB_URL
    );
    if(connection){
        console.log(`connected to MongoDB:${connection.host}`);
    }
  }catch(e){
console.log(e);
process.exit(1);// kill server terminate it.
  }
} 

export default connectionToDB;