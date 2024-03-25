import TokenModel from "../models/token-model";
import UserModel from "../models/user-model";
import db from "./index"

const dbInit = async ()=>{
    try {
        await db.authenticate();
        UserModel.sync({alter: false})
        TokenModel.sync({alter: false})
        console.log("Connection has been established successfully.");
    } catch (error) {
        console.error("Unable to connect to the database:", error)
    }
}

export default dbInit