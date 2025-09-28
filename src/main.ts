import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:3000', // or '*'
    // origin: '*',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
