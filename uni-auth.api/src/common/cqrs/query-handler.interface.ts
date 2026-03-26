import { IQueryInput } from './query-input.interface';
import { IQueryOutput } from './query-output.interface';

export interface IQueryHandler<TRequest extends IQueryInput<TResponse>, TResponse extends IQueryOutput> {
  execute(query: TRequest): Promise<TResponse>;
}
