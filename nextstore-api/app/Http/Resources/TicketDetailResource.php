<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

/**
 * تبدیل مدل Ticket به خروجی JSON — نمای گفتگو.
 *
 * همان فیلدهای فهرست به‌علاوه‌ی همه‌ی پیام‌ها به ترتیب زمان.
 */
class TicketDetailResource extends TicketResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'messages' => TicketMessageResource::collection($this->whenLoaded('messages')),
        ]);
    }
}
