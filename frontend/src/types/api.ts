export type ApiSuccessResponse<TData, TMeta = undefined> = {
  success: true;
  message: string;
  data: TData;
  meta?: TMeta;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: Record<string, string | string[]>;
};

export type ApiResponse<TData, TMeta = undefined> =
  | ApiSuccessResponse<TData, TMeta>
  | ApiErrorResponse;

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined;