import { Routes } from '@angular/router';
import { DeveloperApplicationsListComponent } from './developer-applications-list.component';
import { DeveloperApplicationDetailsComponent } from './developer-application-details.component';

export const developerConsoleRoutes: Routes = [
    { path: '', redirectTo: 'applications', pathMatch: 'full' },
    { path: 'applications', component: DeveloperApplicationsListComponent },
    { path: 'applications/:applicationId', component: DeveloperApplicationDetailsComponent }
];
