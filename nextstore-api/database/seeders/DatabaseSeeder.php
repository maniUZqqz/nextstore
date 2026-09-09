<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * سیدر اصلی — نقطه‌ی ورود ساخت داده‌های نمونه.
 *
 * اجرا:
 *     php artisan db:seed
 *     php artisan migrate:fresh --seed   (بازسازی کامل)
 */
class DatabaseSeeder extends Seeder
{
    /** اجرای ترتیبی همه‌ی سیدرها. */
    public function run(): void
    {
        $this->command->info('ساخت کاربران نمایشی...');
        $this->seedUsers();

        /* کاتالوگ: دسته‌بندی‌ها، برندها و محصولات */
        $this->call([
            CatalogSeeder::class,
            /* سفارش‌های نمایشی — بدون آن‌ها پنل مدیریت خالی است */
            OrderSeeder::class,
            /*
             * نظرات — باید *پس از* کاتالوگ اجرا شود چون امتیاز و
             * تعداد نظر محصولات را از روی ردیف‌های واقعی بازمی‌نویسد.
             */
            ReviewSeeder::class,
            /* مجله — متن‌ها لورم‌اند و محتوای واقعی از پنل وارد می‌شود */
            BlogSeeder::class,
            /*
             * تیکت‌های پشتیبانی — باید *پس از* OrderSeeder اجرا شود
             * چون یکی از گفتگوها به یک سفارش واقعی می‌چسبد تا لینک
             * «سفارش مرتبط» در پنل خالی نماند.
             */
            TicketSeeder::class,
            /* کدهای تخفیف — مستقل از بقیه، هر جای فهرست می‌تواند باشد */
            CouponSeeder::class,
            /*
             * تنظیمات فروشگاه — با firstOrCreate کار می‌کند، پس اجرای
             * دوباره‌اش تغییرات مدیر را بازنمی‌گرداند.
             */
            SettingSeeder::class,

            /*
             * بنرهای صفحه‌ی اصلی — همان محتوایی که پیش‌تر در کد بود.
             * با firstOrCreate کار می‌کند، پس ویرایش‌های مدیر را
             * بازنویسی نمی‌کند.
             */
            BannerSeeder::class,
        ]);
    }

    /**
     * ساخت حساب‌های نمایشی.
     *
     * این اطلاعات در README ذکر می‌شود تا بازدیدکننده‌ی نمونه‌کار
     * بتواند بدون ثبت‌نام، پنل کاربری و پنل ادمین را ببیند.
     */
    private function seedUsers(): void
    {
        /* --- مدیر کل --- */
        User::create([
            'name' => 'مدیر فروشگاه',
            'email' => 'admin@demo.dev',
            'phone' => '09120000001',
            'password' => 'password',
            'role' => UserRole::Admin,
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'is_active' => true,
        ]);

        /* --- مدیر محتوا --- */
        User::create([
            'name' => 'مدیر محتوا',
            'email' => 'manager@demo.dev',
            'phone' => '09120000002',
            'password' => 'password',
            'role' => UserRole::Manager,
            'email_verified_at' => now(),
            'is_active' => true,
        ]);

        /* --- مشتری نمونه به‌همراه یک آدرس --- */
        $customer = User::create([
            'name' => 'کاربر نمونه',
            'email' => 'user@demo.dev',
            'phone' => '09120000003',
            'password' => 'password',
            'role' => UserRole::Customer,
            'email_verified_at' => now(),
            'is_active' => true,
        ]);

        Address::create([
            'user_id' => $customer->id,
            'label' => 'خانه',
            'recipient_name' => 'کاربر نمونه',
            'recipient_phone' => '09120000003',
            'province' => 'تهران',
            'city' => 'تهران',
            'street' => 'خیابان ولیعصر، بالاتر از میدان ونک',
            'postal_code' => '1969764411',
            'building_no' => '۱۲',
            'unit' => '۳',
            'is_default' => true,
        ]);
    }
}
