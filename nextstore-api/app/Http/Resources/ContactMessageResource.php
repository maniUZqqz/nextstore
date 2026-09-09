<?php

namespace App\Http\Resources;

use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * یک پیام «تماس با ما» برای پنل مدیریت.
 *
 * @mixin ContactMessage
 */
class ContactMessageResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'subject' => $this->subject,
            'message' => $this->message,

            'isRead' => $this->is_read,
            'readAt' => $this->read_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),

            /*
             * ⚠️ IP فقط وقتی فرستاده می‌شود که مدیر یک پیام را باز کرده
             *    باشد، نه در فهرست. در فهرست به درد نمی‌خورد و بی‌دلیل
             *    داده‌ی شخصی را در هر پاسخ پخش می‌کند.
             */
            'ip' => $this->whenNotNull($this->when($request->routeIs('*.show'), $this->ip)),

            /*
             * فرستنده‌ی ثبت‌نام‌کرده — اگر بود.
             *
             * ⚠️ نامِ اینجا با نامِ بالا فرق دارد و باید هم فرق داشته
             *    باشد: بالا چیزی است که در فرم نوشته، این چیزی است که
             *    در حسابش دارد. مدیر باید هر دو را ببیند.
             */
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ] : null),
        ];
    }
}
