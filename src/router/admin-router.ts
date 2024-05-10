import express, {Request, Response} from "express"
import { container } from "tsyringe"
import UserController from "../controllers/user-controller"
import { validator, AdminAuth } from "../middlewares/index.middleware"
import ValidationSchema from "../validators/user-validator-schema"
import AccountController from "../controllers/account-controller"
import TransactionController from "../controllers/transaction-controller"




const router = express.Router()

const userController = container.resolve(UserController)
const accountController = container.resolve(AccountController)
const transactionController = container.resolve(TransactionController)


const createAdminRoute = () => {
    router.get('/users', AdminAuth(), (req:Request, res:Response)=> {
        return userController.getAllUsersByAdmin(req, res)
    })

    router.get('/user:id', AdminAuth(), (req:Request, res:Response)=> {
        return userController.getSingleUserById(req, res)
    })

    router.get('/user/set-user-status', validator(ValidationSchema.setAccountStatusSchema), AdminAuth(), (req:Request, res:Response)=> {
        return userController.setAccountStatus(req, res)
    })

    router.get('/accounts', AdminAuth(), (req:Request, res:Response)=> {
        return accountController.getAllUserAccountsByAdmin(req, res)
    })

    router.get('/accounts:id', AdminAuth(), (req:Request, res:Response)=> {
        return accountController.getUserAccountAdmin(req, res)
    })

    router.get('/transactions', AdminAuth(), (req:Request, res:Response)=> {
        return transactionController.getAllTransactionsAdmin(req, res)
    })

    return router
}

export default createAdminRoute()