import {Request, Response} from "express"
import { ResponseCode } from "../interfaces/enum/code.enum"
import PaymentService from "../services/payment-service"
import TransactionService from "../services/transaction-service"
import utility from "../utils/index.utils"
import sequelize from "../database"
import { TransactionGateway, TransactionStatus } from "../interfaces/enum/transaction-enum"
import AccountService from "../services/account-service"
import { IAccount } from "../interfaces/account-interface"
import { ITransaction } from "../interfaces/transaction-interface"
import PayeeService from "../services/payee-service"
import { autoInjectable } from "tsyringe"

@autoInjectable()
class TransactionController {
    private transactionService : TransactionService
    private accountService : AccountService
    private payeeService : PayeeService

    constructor(_transactionService: TransactionService, _accountService: AccountService, _payeeService: PayeeService){
        this.transactionService = _transactionService
        this.accountService = _accountService
        this.payeeService = _payeeService
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

    private async transfer(senderAccount:IAccount,receiverAccount:IAccount, amount:number): Promise<{status: boolean, transaction:ITransaction | null} >{
        const tx = await sequelize.transaction()
        try {
            await this.accountService.topUpBalance(senderAccount.id, -amount, {transaction:tx})
            await this.accountService.topUpBalance(receiverAccount.id, amount, {transaction:tx})
            const newTransaction = {
                userId: senderAccount.userId,
                accountId: senderAccount.userId,
                amount,
                detail: {
                    receiverAccountNumber: receiverAccount.accountNumber
                }
            }
            let transfer = await this.transactionService.processInternalTransfer(newTransaction, {transaction:tx})
            await tx.commit()
            return {status: true, transaction:transfer}
        } catch (error) {
            await tx.rollback()
            return {status: false, transaction:null}
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
            return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
        }
    }

    private async transferToExternalAccount(senderAccount: IAccount, receiverAccount: IAccount, reference : string ,amount: number): Promise<{ status: boolean, transaction: ITransaction | null }> {
        const tx = await sequelize.transaction();
        try {
          await this.accountService.topUpBalance(senderAccount.id, -amount, { transaction: tx });
          const newTransaction = {
            userId: senderAccount.userId,
            reference,
            accountId: senderAccount.id,
            amount,
            detail: {
              recieverAccountNumber: receiverAccount.accountNumber,
              gateway:TransactionGateway.PAYSTACK
            }
          }
    
          let transfer = await this.transactionService.processExternalTransfer(newTransaction, { transaction: tx })
    
    
          await tx.commit();
          return { status: true, transaction: transfer }
        } catch (error) {
          await tx.rollback();
          return { status: false, transaction: null }
    
        }
      }
    

    async verifyPaystackDeposit(req: Request, res: Response) {
        try {
            const params = {...req.body}
            const transaction = await this.transactionService.fetchTransactionByReference(params.reference)
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
            return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
        }
    }

    async internalTransfer(req: Request, res: Response) {
        try {
            const params = {...req.body}
           const senderAccount = await this.accountService.getAccountByField({id:params.id})
            if(!senderAccount){
                return utility.handleError(res, "Invalid sender account", ResponseCode.NOT_FOUND)
            }

            if(senderAccount.balance < params.amount){
                return utility.handleError(res, "Insufficient balance", ResponseCode.BAD_REQUEST)
            }

            if(params.amount <= 0){
                return utility.handleError(res, "Amount must be above zero", ResponseCode.BAD_REQUEST)
            }

            const receiverAccount = await this.accountService.getAccountByField({accountNumber: params.receiverAccountNumber})
            if(!receiverAccount){
                return utility.handleError(res, "Invalid account number", ResponseCode.NOT_FOUND)
            }

            if(senderAccount.userId == receiverAccount.userId){
                return utility.handleError(res, "Sender cannot send to his own account", ResponseCode.BAD_REQUEST)
            }

            const result = await this.transfer(senderAccount, receiverAccount, params.amount)
            if(!result){
                return utility.handleError(res, "Internal transfer failed", ResponseCode.BAD_REQUEST)
            }

            return utility.handleSuccess(res, 'Transfer completed successfully', {transaction:result.transaction}, ResponseCode.SUCCESS)
        } catch (error) {
            return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
        }
    }

    async withdrawByPaystack(req: Request, res: Response) {
        try {
            const params = {...req.body}
           const senderAccount = await this.accountService.getAccountByField({id:params.id})
            if(!senderAccount){
                return utility.handleError(res, "Invalid sender account", ResponseCode.NOT_FOUND)
            }

            if(senderAccount.balance < params.amount){
                return utility.handleError(res, "Insufficient balance", ResponseCode.BAD_REQUEST)
            }

            if(params.amount <= 0){
                return utility.handleError(res, "Amount must be above zero", ResponseCode.BAD_REQUEST)
            }

            let payeeRecord = await this.payeeService.fetchPayeeByAccountNumberAndBank(params.receiverAccountNumber, params.bankCode)
            let recipientID = ""
            if(!payeeRecord){
                const paystackPayeeRecord = {
                    accountNumber: params.receiverAccountNumber,
                    accountName: params.receiverAccountName,
                    bankCode: params.bankCode
                }

                recipientID = (await PaymentService.createPaystackRecipient(paystackPayeeRecord)) as string
                if(recipientID){
                    payeeRecord = await this.payeeService.savePayeeRecord({
                        userId : params.user.id,
                        accountNumber: params.receiverAccountNumber,
                        accountName: params.receiverAccountName,
                        bankCode: params.bankCode,
                        detail: {
                            paystackRecipientId: recipientID
                        }
                    })
                }else {
                    return utility.handleError(res, "Invalid payment account, please try another payout method", ResponseCode.BAD_REQUEST)
                }
            }else{
                recipientID = payeeRecord.detail.paystackRecipientId as string
            }

            const transferData = await PaymentService.initiatePaystackTransfer(recipientID, params.amount, params.message)
            if(!transferData){
                return utility.handleError(res, "Paystack transaction failed", ResponseCode.BAD_REQUEST)
            }

            const result = await this.transferToExternalAccount(senderAccount, params.receiverAccountNumber,  transferData.reference, params.amount,)
            if(!result.status){
                return utility.handleError(res, "Withdrawal transaction failed", ResponseCode.BAD_REQUEST)
            }


            return utility.handleSuccess(res, 'Transfer completed successfully', {transaction:result.transaction}, ResponseCode.SUCCESS)
        } catch (error) {
            return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
        }
    }

    async getAllUserTransactions(req: Request, res: Response) {
        try {
          const params = { ...req.body };
          let filter = {} as ITransaction;
          filter.userId = params.user.id;
          if(params.accountId){
            filter.accountId = params.accountId
          }
          let transactions = await this.transactionService.getTransactionsByField(filter)
          return utility.handleSuccess(res, "Transactions fetched successfully", { transactions }, ResponseCode.SUCCESS);
        } catch (error) {
          return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
        }
      }
    
      async getUserTransaction(req: Request, res: Response) {
        try {
          const params = { ...req.params };
          let transaction = await this.transactionService.getTransactionByField({ id:utility.escapeHtml(params.id) });
          if (!transaction) {
            return utility.handleError(res, "Transaction does not exist", ResponseCode.NOT_FOUND);
          }
          return utility.handleSuccess(res, "Transaction fetched successfully", { transaction }, ResponseCode.SUCCESS);
        } catch (error) {
          return utility.handleError(res, (error as TypeError).message, ResponseCode.SERVER_ERROR);
        }
      }
}

export default TransactionController