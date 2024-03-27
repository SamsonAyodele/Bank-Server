import { Response } from "express";
import { createLogger, format, transports } from "winston";

const logger = createLogger({
  transports: [
    new transports.File({
      filename: "./logs/index.log",
      level: "error",
      format: format.combine(format.timestamp({format: "YYYY-MM-DD HH-mm-ss" }), 
      format.printf((info)=>`${info.timestamp} ${info.level} : ${info.message}`)) 
    }),
  ]
});

const handleSuccess = (res: Response, message: string, data: {}, statusCode: number = 200) => {
  return res.status(statusCode).json({ status: true, message, data: { ...data } });
};

const handleError = (res: Response, message: string, statusCode: number = 400) => {
    logger.log({level: 'error', message})
  return res.status(statusCode).json({ status: false, message });
};

const generateCode = (num: number = 15) => {
  const dateString = Date.now().toString(36);
  const randomNum = Math.random().toString(36).substr(2);
  let result = randomNum + dateString;
  result = result.length > num ? result.substring(0, num) : result;
  return result.toUpperCase();
};

const utility = {
  handleSuccess,
  handleError,
  generateCode,
};

export default utility;
