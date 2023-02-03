import { Handler, HandlerContext, HandlerEvent, HandlerResponse } from "@netlify/functions";

export const serializeUncaughtErrorsHandler = (handler: (event: HandlerEvent, context: HandlerContext) => Promise<HandlerResponse>): Handler =>
  (event, context) =>
    handler(event, context)
      .catch(err => ({ statusCode: 500, body: JSON.stringify(err) }));