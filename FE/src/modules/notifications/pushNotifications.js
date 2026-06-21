import { bizenApi } from "../api/bizenApi";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function getPushSupportState() {
  if (typeof window === "undefined") return { supported: false, permission: "unsupported" };
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  return {
    supported,
    permission: supported ? Notification.permission : "unsupported"
  };
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

export async function enablePushNotifications() {
  const support = getPushSupportState();
  if (!support.supported) {
    throw new Error("Trình duyệt này chưa hỗ trợ thông báo đẩy cho PWA.");
  }

  const config = await bizenApi.pushPublicKey();
  if (!config.enabled || !config.publicKey) {
    throw new Error("Push notification chưa được cấu hình VAPID key trên backend.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Bạn cần cho phép thông báo trên trình duyệt để nhận tin nhắn.");
  }

  const registration = await getServiceWorkerRegistration();
  if (!registration?.pushManager) {
    throw new Error("Service worker chưa sẵn sàng để nhận thông báo.");
  }

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.publicKey)
    }));

  await bizenApi.subscribePushNotifications(subscription.toJSON());
  return {
    enabled: true,
    permission,
    endpoint: subscription.endpoint
  };
}

export async function disablePushNotifications() {
  const registration = await navigator.serviceWorker?.getRegistration?.();
  const subscription = await registration?.pushManager?.getSubscription?.();
  if (!subscription) return { enabled: false };
  await bizenApi.unsubscribePushNotifications(subscription.endpoint).catch(() => {});
  await subscription.unsubscribe();
  return { enabled: false };
}
