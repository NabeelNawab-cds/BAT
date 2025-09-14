import serverless from 'serverless-http';
import { createApp } from '../../../server/index';

// We need to do this async loading of the handler because we need to wait
// for the express app to be created.
let serverlessHandler;

// This function is used to cache the serverless handler, so we don't have to
// recreate it on every request.
async function getHandler() {
    if (serverlessHandler) {
        return serverlessHandler;
    }
    const { app } = await createApp();
    serverlessHandler = serverless(app);
    return serverlessHandler;
}

export const handler = async (event, context) => {
  const server = await getHandler();
  return server(event, context);
};
