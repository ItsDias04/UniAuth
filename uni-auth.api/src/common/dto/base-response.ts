export interface BaseResponse<T> {
  data: T | null;
  success: boolean;
  message?: string;
}
