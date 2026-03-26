import { ICommand } from '@nestjs/cqrs';
import { ICommandOutput } from './command-output.interface';

export interface ICommandInput<TResponse extends ICommandOutput>
  extends ICommand {}
