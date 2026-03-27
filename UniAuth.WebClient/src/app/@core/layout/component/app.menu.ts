import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Консоль разработчика',
                items: [
                    {
                        label: 'Приложения',
                        icon: 'pi pi-fw pi-id-card',
                        routerLink: ['/developer-console/applications']
                    }
                ]
            },
            {
                label: 'Главная',
                items: [{ label: 'Дашборд', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
            },
            {
                label: 'Интеграции',
                items: [
                    {
                        label: 'Внешние системы',
                        icon: 'pi pi-fw pi-link',
                        routerLink: ['/pages/external-systems']
                    },
                    {
                        label: 'Регистрация клиента',
                        icon: 'pi pi-fw pi-plus-circle',
                        routerLink: ['/pages/external-systems/register']
                    },
                ]
            },
            {
                label: 'Страницы',
                icon: 'pi pi-fw pi-briefcase',
                routerLink: ['/pages'],
                items: [
                    {
                        label: 'Аутентификация',
                        icon: 'pi pi-fw pi-user',
                        items: [
                            {
                                label: 'Вход',
                                icon: 'pi pi-fw pi-sign-in',
                                routerLink: ['/auth/login']
                            },
                            {
                                label: 'Регистрация',
                                icon: 'pi pi-fw pi-user-plus',
                                routerLink: ['/auth/register']
                            },
                            {
                                label: 'Доступ запрещён',
                                icon: 'pi pi-fw pi-lock',
                                routerLink: ['/auth/access']
                            }
                        ]
                    },
                    {
                        label: 'Документация',
                        icon: 'pi pi-fw pi-book',
                        routerLink: ['/documentation']
                    },
                ]
            },
        ];
    }
}
