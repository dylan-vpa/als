if ("serviceWorker" in navigator) {
  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/pwa-sw.js", { scope: "/" });
      console.info("[PWA] Service worker registrado", registration.scope);
    } catch (error) {
      console.error("[PWA] Error registrando service worker", error);
    }
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register);
  }
}
