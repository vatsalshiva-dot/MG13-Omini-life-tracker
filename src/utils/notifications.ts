export const sendBackgroundNotification = async (title: string, options: any) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && 'showNotification' in registration && Notification.permission === 'granted') {
      registration.showNotification(title, options);
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  } catch (e) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }
};
