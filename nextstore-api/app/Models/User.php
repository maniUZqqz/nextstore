<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * مدل کاربر.
 * ---------------------------------------------------------------------------
 * هم مشتری‌ها و هم مدیران در همین جدول‌اند و با ستون role از هم
 * تفکیک می‌شوند.
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $phone
 * @property UserRole $role
 * @property bool $is_active
 *
 * ⚠️ سه ویژگی زیر ستون جدول نیستند.
 *
 *    `AdminCustomerController::baseQuery()` آن‌ها را با
 *    `withCount`, `withSum` و یک زیرکوئری به هر ردیف می‌چسباند.
 *    اعلامشان اینجا هم به تحلیل ایستا می‌گوید که وجود دارند و
 *    هم به خواننده می‌گوید که فقط در همان کوئری پر می‌شوند —
 *    روی یک `User` معمولی تهی‌اند، و برای همین nullable
 *    اعلام شده‌اند.
 * @property-read int|null $orders_count
 * @property-read int|null $paid_orders_sum_total
 * @property-read string|null $last_order_at
 */
class User extends Authenticatable
{
    /** HasApiTokens متدهای createToken و tokens را اضافه می‌کند (Sanctum). */
    use HasApiTokens;

    use HasFactory;
    use Notifiable;

    /** ستون‌های قابل پر شدن انبوه. */
    protected $fillable = [
        'name', 'email', 'phone', 'password',
        'role', 'avatar', 'birth_date', 'is_active',
    ];

    /**
     * ستون‌هایی که هرگز در خروجی JSON ظاهر نمی‌شوند.
     * ⚠️ حیاتی: بدون این، هش رمز عبور در پاسخ API لو می‌رود.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /** تبدیل خودکار نوع ستون‌ها. */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'birth_date' => 'date',
            'is_active' => 'boolean',

            /* رشته نقش به Enum تبدیل می‌شود → تایپ‌سیفتی */
            'role' => UserRole::class,

            /*
             * هش خودکار رمز عبور هنگام ذخیره.
             * با این کست، هرجا $user->password = 'plain' بنویسیم،
             * لاراول خودش آن را هش می‌کند. یعنی امکان ذخیره‌ی تصادفی
             * رمز خام وجود ندارد.
             */
            'password' => 'hashed',
        ];
    }

    /* =====================================================================
     * رابطه‌ها
     * ===================================================================== */

    /** @return HasMany<Address, $this> */
    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /** @return HasOne<Cart, $this> */
    public function cart(): HasOne
    {
        return $this->hasOne(Cart::class);
    }

    /** @return HasMany<Ticket, $this> */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    /** @return HasMany<Review, $this> */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /** @return HasMany<Wishlist, $this> */
    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }

    /**
     * محصولات پسندیده‌شده — مستقیم، بدون عبور از مدل واسط.
     *
     * چرا هم wishlists و هم این؟
     *   wishlists برای نوشتن (افزودن و حذف یک ردیف) لازم است و
     *   wishlistProducts برای خواندن، چون صفحه‌ی علاقه‌مندی به
     *   خودِ محصول‌ها نیاز دارد نه ردیف‌های واسط. با belongsToMany
     *   لاراول در یک کوئری JOIN می‌زند به‌جای دو رفت‌وبرگشت.
     *
     * @return BelongsToMany<Product, $this>
     */
    public function wishlistProducts(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'wishlists')
            ->withTimestamps();
    }

    /* =====================================================================
     * Scope ها
     * ===================================================================== */

    /** فقط کاربران فعال (مسدودنشده). */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** فیلتر بر اساس نقش. */
    public function scopeWithRole(Builder $query, UserRole $role): Builder
    {
        return $query->where('role', $role);
    }

    /* =====================================================================
     * متدهای کمکی
     * ===================================================================== */

    /** آیا کاربر به پنل مدیریت دسترسی دارد؟ */
    public function isAdmin(): bool
    {
        return $this->role->canAccessAdmin();
    }

    /**
     * ثبت زمان آخرین ورود.
     *
     * ⚠️ باگ خاموشی که اینجا رفع شد:
     *    نسخه‌ی قبلی از `updateQuietly(['last_login_at' => now()])`
     *    استفاده می‌کرد. متد update از انتساب انبوه (Mass Assignment)
     *    عبور می‌کند و فقط ستون‌های داخل $fillable را می‌نویسد.
     *
     *    چون `last_login_at` عمداً در $fillable نیست (نباید از ورودی
     *    کاربر قابل تنظیم باشد)، لاراول آن را **بدون هیچ خطایی**
     *    نادیده می‌گرفت. نتیجه: ستون همیشه NULL می‌ماند و «آخرین
     *    ورود» در پنل کاربری و پنل ادمین هرگز پر نمی‌شد.
     *
     *    راه‌حل: انتساب مستقیم ویژگی و سپس saveQuietly. این روش از
     *    $fillable عبور نمی‌کند، پس ستون واقعاً نوشته می‌شود و در
     *    عین حال ستون از دسترس انتساب انبوه بیرون می‌ماند.
     *
     *    saveQuietly رویدادها و Observer ها را فعال نمی‌کند — این
     *    فقط یک ثبت آماری است و نباید منطق دیگری را راه بیندازد.
     */
    public function recordLogin(): void
    {
        $this->last_login_at = now();
        $this->saveQuietly();
    }
}
