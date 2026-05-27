self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch(e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'Omnilife Tracker';
  const options = {
    body: data.body || 'You have a new alert',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, type, ...options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        icon: options.icon || '/icon.svg',
        badge: options.badge || '/icon.svg',
        ...options
      })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Handle action buttons clicked from notification UI (e.g., pause, resume, stop)
  if (event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        clientList.forEach(function(client) {
          client.postMessage({
            type: 'POMO_ACTION',
            action: event.action
          });
        });
      })
    );
    return;
  }

  // Open / focus the app when notification body is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow(event.notification.data || '/');
    })
  );
});
