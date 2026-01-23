import awsLambdaFastify from '@fastify/aws-lambda';
import buildApp from '../server/app.js';

const app = await buildApp();
const proxy = awsLambdaFastify(app);

export const handler = async (event, context) => proxy(event, context);

export default handler;
