import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';


// Force rebuild timestamp: 2025-12-05
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

