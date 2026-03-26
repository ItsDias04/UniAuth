import { IQuery } from '@nestjs/cqrs';
import { IQueryOutput } from './query-output.interface';

export interface IQueryInput<TResponse extends IQueryOutput>
  extends IQuery {}
