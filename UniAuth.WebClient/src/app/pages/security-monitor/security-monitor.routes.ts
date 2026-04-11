import { Routes } from '@angular/router';
import { SecurityMonitorDashboardComponent } from './security-monitor-dashboard.component';
import { securityOfficerGuard } from '@/guards/security-officer.guard';

export const securityMonitorRoutes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    {
        path: 'dashboard',
        component: SecurityMonitorDashboardComponent,
        canActivate: [securityOfficerGuard]
    }
];
