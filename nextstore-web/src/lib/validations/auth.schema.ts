/**
 * اسکیماهای اعتبارسنجی فرم‌های احراز هویت
 * ---------------------------------------------------------------------------
 * اعتبارسنجی در دو لایه انجام می‌شود:
 *   کلاینت (اینجا) → بازخورد فوری بدون رفت‌وبرگشت شبکه
 *   سرور (لاراول)  → لایه‌ی امنیتی واقعی
 *
 * ⚠️ اعتبارسنجی کلاینت هرگز جایگزین سرور نیست — فقط تجربه‌ی بهتر است.
 *    هر کسی می‌تواند درخواست را مستقیم به API بفرستد.
 *
 * قواعد اینجا باید با RegisterRequest و LoginRequest در بک‌اند
 * هماهنگ باشند، وگرنه کاربر پیام‌های متناقض می‌بیند.
 */

import { z } from 'zod'

/** الگوی شماره موبایل ایران: با ۰۹ شروع می‌شود و ۱۱ رقم است. */
const IRAN_MOBILE = /^09\d{9}$/

/**
 * ساخت اسکیمای ورود با پیام‌های محلی‌سازی‌شده.
 *
 * چرا تابع و نه ثابت؟ پیام‌های خطا باید به زبان کاربر باشند،
 * و تابع ترجمه فقط داخل کامپوننت در دسترس است.
 *
 * @param t تابع ترجمه از useTranslations('auth.validation')
 */
export function createLoginSchema(t: (key: string) => string) {
  return z.object({
    email: z
      .string()
      .min(1, t('emailRequired'))
      .email(t('emailInvalid')),

    password: z
      .string()
      .min(1, t('passwordRequired')),

    remember: z.boolean().optional(),
  })
}

/**
 * ساخت اسکیمای ثبت‌نام با پیام‌های محلی‌سازی‌شده.
 */
export function createRegisterSchema(t: (key: string) => string) {
  return z
    .object({
      name: z
        .string()
        .min(3, t('nameMin'))
        .max(100, t('nameMax')),

      email: z
        .string()
        .min(1, t('emailRequired'))
        .email(t('emailInvalid')),

      /* موبایل اختیاری است — رشته خالی هم پذیرفته می‌شود */
      phone: z
        .string()
        .regex(IRAN_MOBILE, t('phoneInvalid'))
        .optional()
        .or(z.literal('')),

      password: z
        .string()
        .min(8, t('passwordMin'))
        /* حداقل یک حرف و یک عدد — همان قاعده‌ی بک‌اند */
        .regex(/[a-zA-Z]/, t('passwordLetters'))
        .regex(/\d/, t('passwordNumbers')),

      password_confirmation: z.string().min(1, t('confirmRequired')),

      /*
       * پذیرش قوانین.
       * از boolean + refine استفاده می‌کنیم نه z.literal(true)، چون:
       *   ۱. در Zod نسخه ۴ امضای literal برای پیام سفارشی تغییر کرده
       *   ۲. نوع خروجی boolean می‌ماند و با تایپ RegisterInput سازگار است
       *      (literal(true) نوع `true` می‌داد و مقدار اولیه false را رد می‌کرد)
       */
      accept_terms: z
        .boolean()
        .refine((value) => value === true, { message: t('termsRequired') }),
    })
    /*
     * بررسی تطابق رمز و تکرارش.
     * refine روی کل شیء اجرا می‌شود چون به دو فیلد نیاز دارد.
     * path مشخص می‌کند خطا زیر کدام فیلد نمایش داده شود.
     */
    .refine((data) => data.password === data.password_confirmation, {
      message: t('passwordMismatch'),
      path: ['password_confirmation'],
    })
}

/** نوع مقادیر فرم ورود — از اسکیما استخراج می‌شود. */
export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>

/** نوع مقادیر فرم ثبت‌نام. */
export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>
