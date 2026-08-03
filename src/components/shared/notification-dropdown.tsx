"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Dumbbell, Droplets, TrendingUp, Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  icon: React.ReactNode;
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

const staticNotifications: Notification[] = [
  {
    id: "1",
    icon: <Trophy className="size-4 text-yellow-500" />,
    title: "New Achievement!",
    message: "You've completed a 7-day workout streak. Keep it up!",
    time: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
  {
    id: "2",
    icon: <Droplets className="size-4 text-blue-500" />,
    title: "Hydration Reminder",
    message: "You're 2 glasses behind your daily water goal.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
  },
  {
    id: "3",
    icon: <TrendingUp className="size-4 text-green-500" />,
    title: "Progress Update",
    message: "You've lost 1.2 lbs this week. Great progress!",
    time: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: true,
  },
  {
    id: "4",
    icon: <Dumbbell className="size-4 text-purple-500" />,
    title: "Workout Scheduled",
    message: "Upper body day starts in 1 hour. Don't forget to warm up!",
    time: new Date(Date.now() - 1000 * 60 * 60 * 8),
    read: true,
  },
];

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = staticNotifications.filter((n) => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        onClick={() => setOpen(!open)}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="bg-destructive absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="border-border bg-popover absolute top-full right-0 mt-2 w-80 overflow-hidden rounded-lg border shadow-lg">
          {/* Header */}
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <span className="text-muted-foreground text-xs">
              {unreadCount} unread
            </span>
          </div>

          {/* Scrollable list */}
          <div className="max-h-72 overflow-y-auto">
            {staticNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-border flex gap-3 border-b px-4 py-3 last:border-b-0 ${
                  !notification.read ? "bg-accent/50" : ""
                }`}
              >
                <div className="mt-0.5 shrink-0">{notification.icon}</div>
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm leading-tight font-medium">
                    {notification.title}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {notification.message}
                  </p>
                  <p className="text-muted-foreground/70 text-xs">
                    {formatDistanceToNow(notification.time, {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {!notification.read && (
                  <div className="bg-primary mt-2 size-2 shrink-0 rounded-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
