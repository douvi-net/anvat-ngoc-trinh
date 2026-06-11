self.addEventListener("push", (event) => {
    if (!event.data) return;
  
    let data = {};
  
    try {
      data = event.data.json();
    } catch (error) {
      data = {
        title: "Ăn Vặt Ngọc Trinh",
        body: event.data.text(),
      };
    }
  
    const title = data.title || "Ăn Vặt Ngọc Trinh";
  
    const options = {
      body: data.body || "Bạn có cập nhật đơn hàng mới.",
      icon: data.icon || "/icon.png",
      badge: data.badge || "/icon.png",
      vibrate: [200, 100, 200],
      tag: data.tag || "avnt-order-status",
      renotify: true,
      data: {
        url: data.url || "/tra-cuu-don",
        orderId: data.data?.orderId,
        orderCode: data.data?.orderCode,
        status: data.data?.status,
      },
      actions: [
        {
          action: "view",
          title: "Xem đơn hàng",
        },
        {
          action: "close",
          title: "Đóng",
        },
      ],
    };
  
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  });
  
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
  
    if (event.action === "close") return;
  
    const targetUrl = event.notification.data?.url || "/tra-cuu-don";
  
    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((windowClients) => {
          for (const client of windowClients) {
            if ("focus" in client) {
              client.navigate(targetUrl);
              return client.focus();
            }
          }
  
          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }
        })
    );
  });