<?php

/**
 * Authentication messages — English
 *
 * The "failed" message is deliberately vague: it does not reveal whether
 * the email exists, to prevent user enumeration attacks.
 */

return [
    'failed' => 'These credentials do not match our records.',
    'password' => 'The provided password is incorrect.',
    'throttle' => 'Too many login attempts. Please try again in :seconds seconds.',
    'account_disabled' => 'Your account has been disabled. Please contact support.',

    'registered' => 'Registration completed successfully.',
    'logged_in' => 'Signed in successfully.',
    'logged_out' => 'Signed out successfully.',
    'logged_out_all' => 'Signed out from all devices.',
    'unauthenticated' => 'You must sign in to access this section.',

    /* --- بازیابی رمز عبور --- */
    'reset_link_sent' => 'If that email is registered with us, a reset link has been sent to it. Check your inbox and spam folder.',
    'reset_token_invalid' => 'This link is not valid or has expired. Please request a new reset.',
    'reset_token_missing' => 'The reset link is incomplete. Open it again from your email.',
    'password_reset' => 'Your password has been changed. You can sign in now.',
    'email_required' => 'Please enter your email.',
    'email_invalid' => 'That email is not valid.',
    'password_required' => 'Please enter a password.',
    'password_mismatch' => 'The two passwords do not match.',

    /* --- Email verification --- */
    'email_verification_sent' => 'Verification email sent. Check your inbox (and spam folder).',
    'email_verified' => 'Your email has been verified.',
    'email_already_verified' => 'Your email is already verified.',
    'email_verification_invalid' => 'This verification link is invalid or has expired. Request a new one from your profile.',
];
