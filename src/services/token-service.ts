import moment from "moment";
import { IFindTokenQuery, IToken, ITokenCreationBody, ITokenDataSource } from "../interfaces/token-interface";
import utility from "../utils/index.utils";

class TokenService {
  private tokenDataSource: ITokenDataSource;
  private readonly tokenExpires: number = 5;
  public TokenTypes = {
    FORGOT_PASSWORD: "FORGOT_PASSWORD",
  };
  public TokenStatus = {
    NOT_USED: "NOT_USED",
    USED: "USED",
  };

  constructor(_tokenDataSource: ITokenDataSource) {
    this.tokenDataSource = _tokenDataSource;
  }

  async getTokenByField(record: Partial<IToken>): Promise<IToken | null> {
    const query = { where: { ...record }, raw: true } as IFindTokenQuery;
    return this.tokenDataSource.fetchOne(query);
  }

  async createForgotPasswordToken(email: string): Promise<IToken | null> {
    const tokenData = {
      key: email,
      type: this.TokenTypes.FORGOT_PASSWORD,
      expires: moment().add(this.tokenExpires, "minutes").toDate(),
      status: this.TokenStatus.USED,
    } as ITokenCreationBody;
    let token = this.createToken(tokenData);
    return token;
  }

  async createToken(record: ITokenCreationBody) {
    const tokenData = { ...record };
    let validCode = false;
    while (!validCode) {
      tokenData.code = utility.generateCode(6);
      //fetch token from database
      const isCodeExist = this.getTokenByField({ code: tokenData.code });
      if (!isCodeExist) {
        validCode = true;
        break;
      }
    }
    return this.tokenDataSource.create(tokenData);
  }

  async updateRecord(searchBy: Partial<IToken>, record: Partial<IToken>): Promise<void>{
    const query = {where: {...searchBy}, raw: true} as IFindTokenQuery
    return this.tokenDataSource.updateOne(record, query)
  }
}

export default TokenService;
