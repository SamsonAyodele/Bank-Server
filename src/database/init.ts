import db from "./index"
import TokenModel from "../models/token-model";
import UserModel from "../models/user-model";
import AccountModel from "../models/account-model";
import TransactionModel from "../models/transaction-model";
import PayeeModel from "../models/payee-model";
import LoanModel from "../models/loan-model";

const dbInit = async ()=>{
    try {
        await db.authenticate();
        UserModel.sync({alter: false})
        TokenModel.sync({alter: false})
        AccountModel.sync({alter: false})
        TransactionModel.sync({alter:false})
        PayeeModel.sync({alter:false})
        LoanModel.sync({alter:false,hooks:true})
        console.log("Connection has been established successfully.");
    } catch (error) {
        console.error("Unable to connect to the database:", error)
    }
}

export default dbInit