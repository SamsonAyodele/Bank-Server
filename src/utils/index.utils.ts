import { Response } from "express";
import { createLogger, format, transports } from "winston";
import { BANKS } from "../interfaces/enum/payee-enum";

const logger = createLogger({
  transports: [
    new transports.File({
      filename: "./logs/index.log",
      level: "error",
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH-mm-ss" }),
        format.printf((info) => `${info.timestamp} ${info.level} : ${info.message}`)
      ),
    }),
  ],
});

const  escapeHtml = (html:string) => {
  return html.replace(/[&<>"']/g, '');
}

const isEmpty = (data: any) => {
  return !data || data.length === 0 || typeof data === "undefined" || data == null || Object.keys(data).length == 0;
};

const handleSuccess = (res: Response, message: string, data: {}, statusCode: number = 200) => {
  return res.status(statusCode).json({ status: true, message, data: { ...data } });
};

const handleError = (res: Response, message: string, statusCode: number = 400) => {
  logger.log({ level: "error", message });
  return res.status(statusCode).json({ status: false, message });
};

const generateCode = (num: number = 15) => {
  const dateString = Date.now().toString(36);
  const randomNum = Math.random().toString(36).substr(2);
  let result = randomNum + dateString;
  result = result.length > num ? result.substring(0, num) : result;
  return result.toUpperCase();
};

const parseToObject = (value: string): any => {
let counter = 0 
let data = JSON.parse(value)
while(counter <= 2){
  if(typeof data == 'object'){
    break
  }else{
    data = JSON.parse(data)
    counter++
  }
}
return data 
}

const getBankName = (bankCode: string): string => {
  const filter = BANKS.filter(item => (item.code == bankCode))
  if(filter.length > 0){
    return filter[0].name
  }
  return ''
}

const utility = {
  isEmpty,
  handleSuccess,
  handleError,
  generateCode,
  parseToObject,
  escapeHtml,
  getBankName
};

export default utility;
