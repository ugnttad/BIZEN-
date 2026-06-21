# BIZEN Capacitor Mobile

Capacitor bọc app React/Vite hiện tại thành app Android/iOS native shell. Web bundle vẫn build từ `FE/dist`, còn native project nằm trong `FE/android`.

## Android

Chạy từ thư mục root:

```bash
npm run mobile:android:sync
npm run mobile:android:open
```

Build APK debug:

```bash
npm run mobile:android:debug
```

APK debug sau khi build:

```text
FE/android/app/build/outputs/apk/debug/app-debug.apk
```

## Quyền Native

Android manifest đã khai báo:

- Camera cho Face ID check-in.
- Fine/coarse location cho GPS chấm công.
- Post notifications/vibrate cho thông báo.
- Internet để gọi BIZEN API.

## API Native

Khi chạy trong Capacitor, frontend gọi:

```text
https://bizen-sigma.vercel.app/api
```

Có thể override bằng env:

```text
VITE_NATIVE_API_URL=https://your-domain.com/api
```

Backend đã cho phép CORS từ origin native `https://localhost`/`capacitor://localhost`.

## iOS

iOS cần macOS + Xcode. Khi chuyển qua máy Mac:

```bash
cd FE
npm install @capacitor/ios
npx cap add ios
npm run build
npx cap sync ios
npx cap open ios
```

Để đưa lên App Store/CH Play cần thêm signing certificate, bundle identifier chính thức, privacy text cho camera/location/notifications, và build release.
