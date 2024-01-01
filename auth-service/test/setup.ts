import { TestController } from './auth/controllers/TestController';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

global.beforeAll(async () => {
  try {
    await TestController.init();
  } catch (err) {}
});
global.beforeEach(async () => {
  try {
  } catch (err) {}
});

global.afterEach(async () => {});
global.afterAll(async () => {
  const cacheManager = TestController.app.get(CACHE_MANAGER);
  cacheManager.store.getClient().quit();
  await Promise.all([TestController.app.close()]);
});
