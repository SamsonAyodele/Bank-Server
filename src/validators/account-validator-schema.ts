import * as yup from 'yup';
import { AccountTypes } from '../interfaces/enum/account-enum';

const createAccountSchema = yup.object({
  type: yup.string().trim().required().oneOf(Object.values(AccountTypes)),  //we use object.value to convert it to an array 
  
});

const ValidationSchema = {
  createAccountSchema
};

export default ValidationSchema;