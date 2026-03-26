import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface InitiateRegistrationRequest {
    login: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
}

export interface InitiateRegistrationResponse {
    registrationId: string;
    expiresInSeconds: number;
    message: string;
}

export interface VerifyRegistrationEmailRequest {
    registrationId: string;
    emailCode: string;
}

export interface VerifyRegistrationEmailResponse {
    tempToken: string;
    message: string;
}

export interface VerifyWhatsAppAndCompleteRegistrationRequest {
    registrationId: string;
    tempToken: string;
    whatsAppCode: string;
}

export interface VerifyWhatsAppAndCompleteRegistrationResponse {
    userId: string;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class RegistrationService {
    private readonly baseUrl = `${environment.apiUrl}/iam/registration`;

    constructor(private readonly http: HttpClient) {}

    initiate(payload: InitiateRegistrationRequest): Observable<InitiateRegistrationResponse> {
        return this.http.post<InitiateRegistrationResponse>(`${this.baseUrl}/initiate`, payload);
    }

    verifyEmail(payload: VerifyRegistrationEmailRequest): Observable<VerifyRegistrationEmailResponse> {
        return this.http.post<VerifyRegistrationEmailResponse>(`${this.baseUrl}/verify-email`, payload);
    }

    verifyWhatsApp(payload: VerifyWhatsAppAndCompleteRegistrationRequest): Observable<VerifyWhatsAppAndCompleteRegistrationResponse> {
        return this.http.post<VerifyWhatsAppAndCompleteRegistrationResponse>(`${this.baseUrl}/verify-whatsapp`, payload);
    }
}
