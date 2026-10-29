import React, { useEffect } from "react";
import { useInAppAlertStore } from "@/lib/notifications/notificationEngine";
import useStore from "@/lib/store";
import { Bell, X } from "lucide-react";

export function InAppNotificationBanner() {
  const alerts = useInAppAlertStore((state) => state.alerts);
  const dismissAlert = useInAppAlertStore((state) => state.dismissAlert);
  const setCurrentChatId = useStore((state) => state.setCurrentChatId);

  useEffect(() => {
    if (alerts.length === 0) return;
    const timer = setTimeout(() => {
      dismissAlert(alerts[0].id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [alerts, dismissAlert]);

  if (alerts.length === 0) return null;

  const currentAlert = alerts[alerts.length - 1];

  return (
    <div
      role="alert"
      data-testid="in-app-notification"
      className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-background-2 border border-primary-7 shadow-lg rounded-lg p-3 max-w-sm text-sm cursor-pointer transition-all"
      onClick={() => {
        setCurrentChatId(currentAlert.chatId);
        dismissAlert(currentAlert.id);
      }}
    >
      <Bell className="w-5 h-5 text-primary-10 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-background-12 truncate">{currentAlert.title}</p>
        <p className="text-background-11 truncate" data-testid="notification-body">
          {currentAlert.body}
        </p>
      </div>
      <button
        type="button"
        className="text-background-11 hover:text-background-12 p-1"
        aria-label="Dismiss notification"
        onClick={(e) => {
          e.stopPropagation();
          dismissAlert(currentAlert.id);
        }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
