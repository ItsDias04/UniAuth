import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthSessionService } from '@/@core/contexts/security/auth-session.service';

@Component({
    selector: 'app-security-officer-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule],
    templateUrl: './security-officer-layout.component.html',
    styleUrl: './security-officer-layout.component.scss'
})
export class SecurityOfficerLayoutComponent {
    private hadDarkClass = false;

    constructor(
        private readonly authSessionService: AuthSessionService,
        private readonly router: Router
    ) {}

    ngOnInit(): void {
        this.hadDarkClass = document.documentElement.classList.contains('app-dark');
        document.documentElement.classList.add('app-dark');
    }

    ngOnDestroy(): void {
        if (!this.hadDarkClass) {
            document.documentElement.classList.remove('app-dark');
        }
    }

    logoutOfficer(): void {
        this.authSessionService.clearSecurityOfficerSession();
        void this.router.navigateByUrl('/security-monitor/login');
    }
}
