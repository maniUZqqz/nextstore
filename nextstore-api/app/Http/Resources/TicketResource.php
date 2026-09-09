<?php

namespace App\Http\Resources;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * تبدیل مدل Ticket به خروجی JSON — نمای فهرست.
 *
 * بدون پیام‌های گفتگو: فهرستی با بیست تیکت نباید صدها پیام را هم
 * با خود بیاورد. فقط پیش‌نمایش آخرین پیام می‌آید.
 *
 * @mixin Ticket
 */
class TicketResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();

        return [
            'id' => $this->id,
            'ticketNumber' => $this->ticket_number,
            'subject' => $this->subject,

            /*
             * هر enum سه‌تایی برمی‌گردد: مقدار خام برای منطق،
             * برچسب برای نمایش، و رنگ معنایی.
             * بدون این، فرانت‌اند باید همان نگاشت‌ها را دوباره
             * بنویسد و دو نسخه‌ی واگرا از یک قاعده به وجود می‌آید.
             */
            'status' => $this->status->value,
            'statusLabel' => $this->status->label($locale),
            'statusColor' => $this->status->color(),

            'department' => $this->department->value,
            'departmentLabel' => $this->department->label($locale),

            'priority' => $this->priority->value,
            'priorityLabel' => $this->priority->label($locale),
            'priorityColor' => $this->priority->color(),

            'acceptsReply' => $this->acceptsReply(),

            'messagesCount' => $this->messages_count ?? 0,
            'lastReplyAt' => $this->last_reply_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),

            /* سفارش مرتبط — فقط شماره، برای لینک دادن */
            'orderNumber' => $this->whenLoaded('order', fn () => $this->order?->order_number),

            /*
             * صاحب تیکت — فقط در صف پشتیبانی بارگذاری می‌شود.
             * در «تیکت‌های من» کاربر خودش را می‌شناسد.
             */
            'customer' => $this->whenLoaded('user', fn () => [
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
        ];
    }
}
