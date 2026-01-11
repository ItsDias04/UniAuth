import { Injectable, Logger } from '@nestjs/common';
import { ICommandHandler, IQueryHandler } from './interfaces';

type HandlerMap = Map<string, ICommandHandler | IQueryHandler>;

@Injectable()
export class MediatorService {
  private readonly commandHandlers: HandlerMap = new Map();
  private readonly queryHandlers: HandlerMap = new Map();
  private readonly logger = new Logger(MediatorService.name);

  registerCommand(name: string, handler: ICommandHandler) {
    this.commandHandlers.set(name, handler);
    this.logger.debug(`Registered command handler: ${name}`);
  }

  registerQuery(name: string, handler: IQueryHandler) {
    this.queryHandlers.set(name, handler);
    this.logger.debug(`Registered query handler: ${name}`);
  }

  async sendCommand<I, O>(name: string, input: I): Promise<O> {
    const h = this.commandHandlers.get(name) as ICommandHandler | undefined;
    if (!h) throw new Error(`No command handler registered for ${name}`);
    // @ts-ignore
    return h.handle(input);
  }

  async sendQuery<I, O>(name: string, input: I): Promise<O> {
    const h = this.queryHandlers.get(name) as IQueryHandler | undefined;
    if (!h) throw new Error(`No query handler registered for ${name}`);
    // @ts-ignore
    return h.handle(input);
  }
}
