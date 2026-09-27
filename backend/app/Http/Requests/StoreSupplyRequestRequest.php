<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplyRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'faculty';
    }

    public function rules(): array
    {
        if ($this->filled('items')) {
            return [
                'items' => ['required', 'array', 'min:1'],
                'items.*.supply_id' => ['required', 'distinct', 'exists:supplies,id'],
                'items.*.quantity' => ['required', 'integer', 'min:1'],
                'items.*.purpose' => ['required', 'string', 'min:1'],
            ];
        }

        return [
            'supply_id' => ['required', 'exists:supplies,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'purpose' => ['required', 'string', 'min:1'],
        ];
    }
}
