import * as yup from 'yup';
import { AccountTypes } from '../interfaces/enum/account-enum';

const initiatePaystackDeposit = yup.object({
  amount: yup.number().required(),
  accountId: yup.string().trim().required()
  
});

const ValidationSchema = {
  initiatePaystackDeposit
};

export default ValidationSchema;