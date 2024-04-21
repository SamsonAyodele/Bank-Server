import {Request, Response} from "express"
import { ResponseCode } from "../interfaces/enum/code.enum"
import PaymentService from "../services/payment-service"
import TransactionService from "../services/transaction-service"
import utility from "../utils/index.utils"
import sequelize from "../database"
import { TransactionStatus } from "../interfaces/enum/transaction-enum"
import AccountService from "../services/account-service"

class TransactionController {
    private transactionService : TransactionService
    private accountService : AccountService

    constructor(_transactionService: TransactionService, _accountService: AccountService){
        this.transactionService = _transactionService
        this.accountService = _accountService
    }


    private async deposit(accountId: string, transactionId: string, amount:number): Promise<boolean>{
        const tx = await sequelize.transaction()
        try {
            await this.accountService.topUpBalance(accountId, amount, {transaction:tx})
            await this.transactionService.setStatus(transactionId, TransactionStatus.COMPLETED, {transaction:tx})
            await tx.commit()
            return true
        } catch (error) {
            await tx.rollback()
            return false
        }
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

    async verifyPaystackTransaction(req: Request, res: Response) {
        try {
            const params = {...req.body}
            const transaction = await this.transactionService.fetchTransactionByRefrence(params.reference)
            if(!transaction){
                return utility.handleError(res, "Invalid transaction", ResponseCode.NOT_FOUND)
            }
            if(transaction.status != TransactionStatus.IN_PROGRESS){
                return utility.handleError(res, "Transaction status not supported", ResponseCode.NOT_FOUND)
            }
          
            const invalidPaymentTx = await PaymentService.verifyPaystackPayment(params.reference, transaction.amount)
            if(!invalidPaymentTx){
                return utility.handleError(res, "Invalid transaction", ResponseCode.NOT_FOUND)
            }

            const deposit = await this.deposit(transaction.accountId, transaction.id, transaction.amount)
            if(!deposit){
                return utility.handleError(res, "Deposit failed", ResponseCode.NOT_FOUND)
            }
            
            return utility.handleSuccess(res, 'Deposit completed successfully', {transaction:deposit}, ResponseCode.SUCCESS)
        } catch (error) {
            
        }
    }
}

export default TransactionController