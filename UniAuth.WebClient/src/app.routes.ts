import { Routes } from '@angular/router';
import { DeveloperConsoleComponent } from './app/pages/iam/developer-console/developer-console.component';

export const appRoutes: Routes = [
    { path: '', redirectTo: 'auth/register', pathMatch: 'full' },
    { path: 'auth', loadChildren: () => import('./app/pages/iam/auth.routes').then((m) => m.authRoutes) },
    { path: 'developer-console', component: DeveloperConsoleComponent },
    { path: '**', redirectTo: 'auth/register' }
];
