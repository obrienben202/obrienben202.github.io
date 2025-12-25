document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const errorEl = document.getElementById("error-message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const endpoint = "https://script.google.com/macros/s/AKfycbwDA57CtHRv1NoY922XpMfuDFHHy_NEfOhlh1QkUIDf1NVbOASaDzqHzSXB3alv9ZTMrA/exec";

    try {
      // Send as application/x-www-form-urlencoded to avoid CORS preflight
      const controller = new AbortController();
      const timeoutMs = 10000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const body = new URLSearchParams({ username, password }).toString();

      const response = await fetch(endpoint, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error("Login request failed:", response.status, response.statusText);
        errorEl.textContent = `Server error: ${response.status}`;
        return;
      }

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseErr) {
        console.error("Could not parse server response as JSON:", text, parseErr);
        errorEl.textContent = "Invalid response from server (see console).";
        return;
      }

      if (result && result.success) {
        sessionStorage.setItem("loggedInUser", username);
        sessionStorage.setItem("userRole", result.role || "");
        sessionStorage.setItem("fullName", result.fullName || "");
        window.location.href = "index.html";
      } else {
        console.warn("Login failed:", result);
        errorEl.textContent = result && result.message ? result.message : "Invalid Username or Password.";
      }
    } catch (err) {
      console.error("Network or fetch error during login:", err);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        errorEl.textContent = "No network connection. Please check your internet connection and try again.";
      } else if (err && err.name === "AbortError") {
        errorEl.textContent = "Request timed out.";
      } else {
        errorEl.textContent = `Network error: ${err && err.message ? err.message : String(err)}`;
      }

      try {
        let dbg = document.getElementById("debug-output");
        if (!dbg) {
          dbg = document.createElement("pre");
          dbg.id = "debug-output";
          dbg.style.whiteSpace = "pre-wrap";
          dbg.style.background = "#f8f8f8";
          dbg.style.padding = "8px";
          dbg.style.marginTop = "8px";
          if (errorEl && errorEl.parentNode) errorEl.parentNode.appendChild(dbg);
        }
        dbg.textContent = `Endpoint: ${endpoint}\nError: ${String(err)}\nNote: request sent as application/x-www-form-urlencoded. If this still fails, open DevTools → Network and copy the failed request entry.`;
      } catch (uiErr) {
        // ignore UI errors
      }
    }
  });
});