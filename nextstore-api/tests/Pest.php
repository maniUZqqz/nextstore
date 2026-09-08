<?php

/**
 * پیکربندی Pest.
 * ---------------------------------------------------------------------------
 * ⚠️ `RefreshDatabase` روی همه‌ی تست‌های Feature اعمال می‌شود، نه تک‌تک.
 *
 *    هر تستی که به دیتابیس دست بزند و پاکش نکند، تست بعدی را با داده‌ی
 *    ناشناخته اجرا می‌کند — و شکستی می‌سازد که به *ترتیب اجرا* بستگی
 *    دارد. چنین شکستی وقتی تنها اجرا شود پاس می‌شود و در سوئیت کامل
 *    می‌افتد؛ سخت‌ترین نوع تست شکننده برای عیب‌یابی.
 *
 * ⚠️ دیتابیس تست در حافظه است (`phpunit.xml` → `DB_DATABASE=:memory:`)،
 *    پس `database/database.sqlite` واقعی هرگز دست نمی‌خورد. اجرای تست
 *    داده‌ی دمو را از بین نمی‌برد.
 */

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
 * تست‌های واحد به دیتابیس نیازی ندارند و عمداً بدون RefreshDatabase
 * اجرا می‌شوند — مهاجرت‌ها برای آزمودن یک تابع محاسباتی، وقت تلف کردن است.
 */
pest()->extend(TestCase::class)->in('Unit');

/* =========================================================================
 * کمکی‌های مشترک
 * ======================================================================= */

/**
 * ساخت یک کاربر مشتری و ورود او.
 *
 * ⚠️ `actingAs` با گارد `sanctum` صدا زده می‌شود، نه گارد پیش‌فرض.
 *    مسیرهای API با `auth:sanctum` محافظت می‌شوند و گارد پیش‌فرض
 *    (session) آن‌ها را باز نمی‌کند — تستی که این را جا بیندازد ۴۰۱
 *    می‌گیرد و شبیه باگ کد به نظر می‌رسد.
 */
function actingAsCustomer(?User $user = null): User
{
    $user ??= User::factory()->create([
        'role' => UserRole::Customer,
    ]);

    test()->actingAs($user, 'sanctum');

    return $user;
}

/** ساخت یک مدیر و ورود او. */
function actingAsAdmin(): User
{
    $admin = User::factory()->create([
        'role' => UserRole::Admin,
    ]);

    test()->actingAs($admin, 'sanctum');

    return $admin;
}
