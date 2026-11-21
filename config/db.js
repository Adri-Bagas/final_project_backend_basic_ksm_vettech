import { connect } from "mongoose";

async function connectDB() {
    try {
        await connect(process.env.MONGO_URI);
        console.log("Database connected");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
}

export default connectDB;
