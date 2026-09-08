<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * تبدیل مدل Address به خروجی JSON.
 */
class AddressResource extends JsonResource
{
    /**
     * ساخت آرایه خروجی.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,

            'recipientName' => $this->recipient_name,
            'recipientPhone' => $this->recipient_phone,

            'province' => $this->province,
            'city' => $this->city,
            'street' => $this->street,
            'postalCode' => $this->postal_code,
            'buildingNo' => $this->building_no,
            'unit' => $this->unit,

            /* آدرس یک‌خطی آماده — تا فرانت‌اند لازم نباشد اجزا را بچسباند */
            'fullAddress' => $this->full_address,

            'isDefault' => $this->is_default,
        ];
    }
}
