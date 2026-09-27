<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEquipmentReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['faculty', 'outsider'], true);
    }

    public function rules(): array
    {
        if ($this->filled('items')) {
            return [
                'items' => ['required', 'array', 'min:1'],
                'items.*.equipment_id' => ['required', 'distinct', 'exists:equipment,id'],
                'items.*.quantity' => ['required', 'integer', 'min:1'],
                'items.*.purpose' => ['required', 'string', 'min:1'],
                'items.*.start_date' => ['required', 'date', 'after_or_equal:today'],
                'items.*.end_date' => ['required', 'date'],
            ];
        }

        return [
            'equipment_id' => ['required', 'exists:equipment,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'purpose' => ['required', 'string', 'min:1'],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            foreach ($this->input('items', []) as $index => $item) {
                if (empty($item['start_date']) || empty($item['end_date'])) {
                    continue;
                }

                if ($item['end_date'] < $item['start_date']) {
                    $validator->errors()->add("items.$index.end_date", 'The end date must be after or equal to the start date.');
                }
            }
        });
    }
}
