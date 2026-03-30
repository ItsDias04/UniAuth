import { Routes } from '@angular/router';
import { AppLayout } from './app/@core/layout/component/app.layout';
import { ExternalRedirectBridgeComponent } from './app/pages/iam/oauth2/external-redirect-bridge.component';
import { ExternalServiceIntegrationDocsComponent } from './app/pages/iam/integration/external-service-integration-docs.component';

export const appRoutes: Routes = [
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
    { path: 'auth', loadChildren: () => import('./app/pages/iam/auth.routes').then((m) => m.authRoutes) },
    { path: 'oauth2/external-redirect/:token1', component: ExternalRedirectBridgeComponent },
    { path: 'oauth2/external-redirect', component: ExternalRedirectBridgeComponent },
    {
        path: 'developer-console',
        component: AppLayout,
        children: [{ path: '', loadChildren: () => import('./app/pages/iam/developer-console/developer-console.routes').then((m) => m.developerConsoleRoutes) }]
    },
    { path: '**', redirectTo: 'auth/login' }
];
