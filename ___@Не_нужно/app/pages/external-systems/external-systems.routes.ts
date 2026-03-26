import { Routes } from '@angular/router';
import { ExternalClientsList } from './external-clients-list';
import { RegisterClient } from './register-client';

export default [
    { path: '', component: ExternalClientsList },
    { path: 'register', component: RegisterClient },
] as Routes;
