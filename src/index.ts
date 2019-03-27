import { UiServerApplication } from './application';
import { ApplicationConfig } from '@loopback/core';

export { UiServerApplication };

export async function main(options: ApplicationConfig = {}) {
  const app = new UiServerApplication(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/explorer to see available endpoints`);

  return app;
}
