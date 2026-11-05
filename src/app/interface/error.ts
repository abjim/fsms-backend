export type TErrorDetail = {
  path: string;
  message: string;
};

export type TErrorDetails = TErrorDetail[];

export type TGenericErrorResponse = {
  statusCode: number;
  message: string;
  errorDetails: TErrorDetails;
};
