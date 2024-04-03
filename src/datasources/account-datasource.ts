import { IAccountDataSource, IAccount, IAccountCreationBody, IFindAccountQuery } from "../interfaces/account-interface";
import AccountModel from "../models/account-model";

class AccountDataSource implements IAccountDataSource{

   async create(record: IAccountCreationBody): Promise<IAccount> {
        return await AccountModel.create(record)
    }

    async fetchOne(query: IFindAccountQuery): Promise<IAccount | null> {
        return await AccountModel.findOne(query)
    }

    async updateOne(searchBy: IFindAccountQuery, data: Partial<IAccount>): Promise<void> {
         await AccountModel.update(data, searchBy)
    }
}

export default AccountDataSource