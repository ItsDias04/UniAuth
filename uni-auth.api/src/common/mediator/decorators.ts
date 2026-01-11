import 'reflect-metadata';
import { COMMAND_HANDLER_METADATA, QUERY_HANDLER_METADATA } from './constants';

export function CommandHandler(name: string): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(COMMAND_HANDLER_METADATA, name, target);
  };
}

export function QueryHandler(name: string): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(QUERY_HANDLER_METADATA, name, target);
  };
}
