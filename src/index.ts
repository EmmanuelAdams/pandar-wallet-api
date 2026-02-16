import { createApp } from './app';
import { config } from './config';

const app = createApp();

app.listen(config.port, () => {
  console.log(
    `Pandar Wallet API running on port ${config.port}`,
  );
  console.log(
    `Swagger docs: http://localhost:${config.port}/api-docs`,
  );
  console.log(`Environment: ${config.nodeEnv}`);
});
