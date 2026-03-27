import { Routes } from '@angular/router';
import { AppLayout } from './app/@core/layout/component/app.layout';
import { ExternalRedirectBridgeComponent } from './app/pages/iam/oauth2/external-redirect-bridge.component';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', redirectTo: 'developer-console/applications', pathMatch: 'full' },
            {
                path: 'developer-console',
                loadChildren: () => import('./app/pages/iam/developer-console/developer-console.routes').then((m) => m.developerConsoleRoutes)
            }
        ]
    },
    { path: 'auth', loadChildren: () => import('./app/pages/iam/auth.routes').then((m) => m.authRoutes) },
    { path: 'oauth2/external-redirect', component: ExternalRedirectBridgeComponent },
    { path: '**', redirectTo: 'developer-console/applications' }
];
