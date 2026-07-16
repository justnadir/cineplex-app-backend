export interface IErrorMessage {
  path: string;
  message: string;
}

export interface IGenericErrorResponse {
  statusCode: number;
  message: string;
  errorMessages: IErrorMessage[];
}
