<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotifyEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message, $status;
    /**
     * Create a new event instance.
     */
    public function __construct($message, $status)
    {
        $this->message = $message;
        $this->status = $status;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn()
    {
        return new Channel('notify-event');
    }

    public function broadcastAs()
    {
        return 'notify-message';
    }

    public function broadcastWith()
    {
        return [
            'message' => $this->message,
            'status' => $this->status
        ];
    }
}
