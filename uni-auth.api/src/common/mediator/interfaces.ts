export interface ICommandInput {}
export interface ICommandOutput {}

export interface ICommandHandler<I extends ICommandInput = any, O extends ICommandOutput = any> {
  handle(input: I): Promise<O> | O;
}

export interface IQueryInput {}
export interface IQueryOutput {}

export interface IQueryHandler<I extends IQueryInput = any, O extends IQueryOutput = any> {
  handle(input: I): Promise<O> | O;
}
