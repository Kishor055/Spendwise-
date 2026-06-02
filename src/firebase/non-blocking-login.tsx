'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from 'firebase/auth';

export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password);
}

export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password);
}

export function initiatePasswordReset(authInstance: Auth, email: string): void {
  sendPasswordResetEmail(authInstance, email);
}

export async function initiatePhoneSignIn(authInstance: Auth, phoneNumber: string, containerId: string) {
  const recaptchaVerifier = new RecaptchaVerifier(authInstance, containerId, {
    'size': 'invisible'
  });
  return signInWithPhoneNumber(authInstance, phoneNumber, recaptchaVerifier);
}
