// hooks/usePusher.ts
import { useEffect } from 'react';
import Pusher from 'pusher-js';
import { toast } from 'react-toastify';

let pusher: Pusher | null = null;

export default function usePusher() {
    useEffect(() => {
        if (!pusher) {
            pusher = new Pusher('b756d2167c1dfe80fcfe', {
                cluster: 'ap1',
                forceTLS: true,
            });

            const channel = pusher.subscribe('notify-event');

            channel.bind('notify-message', function (data: any) {
                if (data.status === 'success') {
                    toast.success(data.message);
                } else {
                    toast.error(data.message);
                }
            });
        }

        return () => {
        };
    }, []);
}
