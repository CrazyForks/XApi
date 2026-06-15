# ⚡ XApi HTTP Client

> **Professional HTTP Debugging & Replay Tool for Chrome**

XApi is a high-performance, open-source Chrome Extension (Manifest V3) that brings a powerful, Postman-like experience directly into your browser's DevTools. It specializes in intercepting, debugging, editing, and replaying HTTP requests with unique support for modifying sensitive headers like `Cookie` and `Origin`.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-1.0.5-green)
![Manifest](https://img.shields.io/badge/Manifest-V3-orange)

---

## 📸 Overview

*Debug directly while you browse without switching tabs.*
*Manage collections and complex requests in a dedicated window.*


https://github.com/user-attachments/assets/490f58f6-b000-49de-80e1-702669052b55

---

## ✨ Key Features

- **🚀 Real-time Interception**: Automatically capture Fetch and XHR traffic from the active tab.
- **🛡️ Sensitive Header Injection**: Industry-leading support for overriding `Cookie`, `Origin`, and `Referer` using `declarativeNetRequest` (DNR) to bypass standard browser security blocks.
- **📂 Collection Management**: Organize your workspace with nested collections and persistent storage.
- **🔄 Smart Replay**: One-click "Send" to replay captured requests with modified parameters or headers.
- **📥 cURL Integration**: Paste raw cURL commands to instantly generate fully editable request objects.
- **🎭 Mock & Response Override**: Intercept live requests and serve custom responses without touching the backend — ideal for front-end development, edge-case testing, and reproducing bugs.
  - **URL Matching**: Rules match by URL prefix (`startsWith`) and HTTP method (`GET`/`POST`/`PUT`/`DELETE`/`ANY`).
  - **Two Modes**:
    - **Replace** — fully override the response with a custom status code, `Content-Type`, and body (JSON, text, HTML, etc.).
    - **JSON Patch** — keep the original response and surgically modify specific fields via JSON paths (e.g. `data.user.name`, `data.list[0].id`); use the `::raw::` prefix to inject numbers, booleans, `null`, or nested JSON.
  - **One-click Mock from Capture**: Right-click any captured response and choose *"Mock this response"* to auto-generate a rule pre-filled with the current payload — start tweaking immediately.
  - **Per-Rule Toggle & Global Switch**: Enable/disable individual rules or flip the global mock master switch from the sidebar; hit counters and last-hit timestamps help you verify rules are firing.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Core Engine**: Chrome Extensions API (Manifest V3 + DNR)

---

## 🚀 Getting Started

### Installation
#### 1. Via Chrome Web Store (Recommended)
XApi is available on the Chrome Web Store. You can search for **XApi** directly or use the link below:
* **Store Link**: [XApi - HTTP Client & API Test](https://chromewebstore.google.com/detail/xapi-http-client-api-test/ilcnglohbiokfdcokfceihebobkpeaij?authuser=0&hl=en)

#### 2. Manual Installation (From Source)
If you prefer to build the extension manually for development purposes:
1.  **Clone & Build**:
    ```bash
    git clone https://github.com/lustan/XApi.git
    cd XApi
    npm install
    npm run build
    ```
2.  **Load in Chrome**:
    - Go to `chrome://extensions/`
    - Enable **Developer mode** (top right)
    - Click **Load unpacked** and select the `dist` folder.

### How to Use

1.  Open **Chrome DevTools** (`F12` or `Ctrl+Shift+I`).
2.  Switch to the **XApi** tab.
3.  Interactions on the current page will appear in the **Captured** history.
4.  Select any request to edit its body, headers, or query params and hit **SEND**.

#### Mocking a Response

1.  Open the **Mock** tab in the sidebar and make sure the global mock switch is **ON**.
2.  Click **New Rule** to define one from scratch, or right-click a captured response and pick **"Mock this response"** to seed a rule from the live payload.
3.  Set the **URL pattern** (prefix match) and **method**, then choose a mode:
    - **Replace** — write the full status / `Content-Type` / body you want returned.
    - **JSON Patch** — add patch rows like `data.user.name = Alice`. Prefix with `::raw::` to inject non-string JSON values, e.g. `::raw::42`, `::raw::true`, `::raw::{"k":1}`.
4.  Reload the page or trigger the request — the rule's **hit counter** confirms it fired.

---

## 🤝 Contributing

We love contributions! Whether it's a bug report, a feature request, or a pull request, we value your input.

1.  **Fork** the project.
2.  **Create** your feature branch (`git checkout -b feature/CoolFeature`).
3.  **Commit** your changes (`git commit -m 'Add CoolFeature'`).
4.  **Push** to the branch (`git push origin feature/CoolFeature`).
5.  **Open** a Pull Request.

---

## 📄 License

Distributed under the **Apache 2.0 License**. See [LICENSE](LICENSE) for details.

---
<p align="center">Made with ❤️ by the XApi Team</p>
