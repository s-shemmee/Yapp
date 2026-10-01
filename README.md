# Yapp — Real-time Web Chat Application 💬

## Overview

Yapp is a real-time chat application built with React, TypeScript, and Firebase. It started as a learning project under the name **ChatNow** and has since grown into Yapp — rebuilt with a polished, accessible UI and a secure Firebase setup.

## Preview

![Screenshot](https://github.com/s-shemmee/ChatNow/assets/56132945/3a36d146-1896-4a5e-bc07-b2d86f955c8b)

## 💻 Technologies Used

### Frontend

- **React 18 + TypeScript**
- **Vite**
- **Material-UI (MUI)**
- **SCSS**
- **React Router**
- **emoji-picker-react**

### Backend

- **Firebase Authentication**
- **Firebase Firestore**
- **Firebase Storage** — chat image attachments
- **Cloudinary** — user avatars

## 🌟 Features

- **Real-time chat** — messages sync instantly
- **Authentication** — sign up, sign in, "remember me"
- **Search & start a chat** — find a user by display name
- **Image attachments** in messages
- **Emoji picker**
- **Message timestamps** and online/offline presence
- **Copy message text** to the clipboard
- **Accessible by default** — keyboard-friendly, labeled controls, visible focus states
- **Responsive design** across screen sizes
- **Archive a chat**
- **Delete a chat**, with a confirmation step
- **Clickable links in messages** — URLs are auto-detected and rendered as links

Security rules are locked down so each user can only access their own data, and avatars/images are validated by type and size before upload.

## 🔮 Upcoming Features

- **Group chats**
- **Read/unread tracking**
- **Block a user**
- **Voice messages**
- **Notifications**
- **Reply and forward** on individual messages
- **Per-message delete**

## 🏁 Getting Started

### Prerequisites

- Node.js 22.12 or newer
- A Firebase project (Firestore, Authentication, and Storage enabled)
- A free [Cloudinary](https://cloudinary.com) account with an **unsigned** upload preset

### 📥 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/s-shemmee/Yapp.git
   cd Yapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the project root:
   ```
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset_name
   ```

4. **Deploy the Firebase security rules**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   firebase deploy --only firestore:rules,storage
   ```

5. **Run the app**
   ```bash
   npm run dev
   ```
   Open the URL Vite prints (typically `http://localhost:5173`).

### Building for production

```bash
npm run build
```

## ⚙️ Usage

1. **Create an account** or sign in.
2. **Search for a user** and select them to start a chat.
3. **Chat in real time** — send text, images, and emoji.

## 🤝 Contributing

Contributions are welcome! If you encounter issues or have suggestions, open an issue or submit a pull request.

## 📝 License

This project is licensed under the [MIT License](./LICENSE).
