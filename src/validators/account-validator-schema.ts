import * as yup from 'yup';
import { AccountTypes } from '../interfaces/enum/account-enum';

const createAccountSchema = yup.object({
  type: yup.string().trim().required().oneOf(Object.values(AccountTypes)),  //we use object.value to convert it to an array 
  
});

const loanApplication = yup.object({
  accountId: yup.string().trim().required(),
  amount: yup.number().required(),
});

const approveOrDeclineLoanSchema = yup.object({
  loanId: yup.string().trim().required(),
  status: yup.string().required().oneOf(Object.values(["ACTIVE","DECLINED"])),
});

const ValidationSchema = {
  createAccountSchema,
  loanApplication,
  approveOrDeclineLoanSchema
};

export default ValidationSchema;