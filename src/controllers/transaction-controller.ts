import {Request, Response} from "express"
import { ResponseCode } from "../interfaces/enum/code.enum"
import PaymentService from "../services/payment-service"
import TransactionService from "../services/transaction-service"
import utility from "../utils/index.utils"

class TransactionController {
    private transactionService : TransactionService

    constructor(_transactionService: TransactionService){
        this.transactionService = _transactionService
    }

    async initiatePaystackDeposit(req: Request, res: Response) {
        try {
            const params = {...req.body}
            const depositInfo = await PaymentService.generatePaystackPaymentUrl(params.user.email, params.amount)
            if(!depositInfo){
                return utility.handleError(res, "Paystack payment not available, try again in few seconds", ResponseCode.NOT_FOUND)
            }
            const newTransaction = {
                userId: params.user.id,
                accountId: params.accountId,
                amount:params.amount,
                reference : depositInfo.reference,
                detail:{}
            }
            let deposit = await this.transactionService.depositByPaystack(newTransaction)
            return utility.handleSuccess(res, 'Transaction created successfully', {transaction:deposit, url:depositInfo.authorization_url}, ResponseCode.SUCCESS)
        } catch (error) {
            
        }
    }
}

export default TransactionController