<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return response()->json($request->user()->notifications()->latest()->paginate(20));
    }

    public function unread(Request $request)
    {
        return response()->json($request->user()->unreadNotifications()->get());
    }

    public function markRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['message' => 'Marked as read.']);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    public function deleteRead(Request $request)
    {
        $deleted = $request->user()->readNotifications()->delete();

        return response()->json([
            'message' => 'Read notifications deleted.',
            'deleted' => $deleted,
        ]);
    }
}
