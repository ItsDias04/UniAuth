import { ICommandInput } from './command-input.interface';
import { ICommandOutput } from './command-output.interface';

export interface ICommandHandler<TRequest extends ICommandInput<TResponse>, TResponse extends ICommandOutput> {
  execute(command: TRequest): Promise<TResponse>;
}
