# Prime Numbers - Phone Number Management System

A beautiful static website for managing premium phone numbers with prices, connected to Firebase Realtime Database.

## Features

✨ **Add Phone Numbers**: Enter phone numbers with prices in MVR (Maldivian Rufiyaa)
📊 **Database Storage**: All data is stored in Firebase Realtime Database
🔍 **Search Functionality**: Quickly find phone numbers
✏️ **Edit & Delete**: Modify or remove entries
🖼️ **Image Generator**: Create professional 5:3 ratio images with up to 10 selected numbers
⬇️ **Download**: Save generated images as PNG files
🎨 **Silom Font**: Beautiful monospace typography throughout

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Click on "Realtime Database" in the left menu
4. Click "Create Database"
5. Choose your location and start in "test mode"
6. Go to Project Settings (gear icon) > General > Your apps
7. Click on the "</>" (Web) icon to add a web app
8. Register your app with a nickname (e.g., "Prime Numbers Web")
9. Copy the `firebaseConfig` object values

### 2. Configure Firebase

Open `firebase-config.js` and replace the placeholder values with your actual Firebase credentials:

```javascript
export const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 3. Run the Website

Since this is a static website, you can run it using any local server:

**Option 1: Python**
```bash
python3 -m http.server 8000
```

**Option 2: Node.js (http-server)**
```bash
npx http-server -p 8000
```

**Option 3: VS Code Live Server**
- Install the "Live Server" extension
- Right-click on `index.html` and select "Open with Live Server"

Then open your browser to `http://localhost:8000`

### 4. Firebase Security Rules (Recommended)

For production, update your Firebase Realtime Database rules:

```json
{
  "rules": {
    "phoneNumbers": {
      ".read": true,
      ".write": true
    }
  }
}
```

For better security, consider adding Firebase Authentication.

## File Structure

```
Prime Numbers/
├── index.html              # Main HTML file
├── styles.css              # CSS styling with Silom font
├── app.js                  # JavaScript functionality
├── firebase-config.js      # Firebase configuration
├── prime numbers profile.svg  # Logo
└── README.md              # This file
```

## Usage

1. **Add Phone Number**: Enter a phone number and price, then click "Add Number"
2. **Search**: Use the search bar to filter phone numbers
3. **Edit**: Click the "Edit" button on any phone number card
4. **Delete**: Click the "Delete" button to remove a phone number
5. **Generate Image**: 
   - Click on phone number cards to select them (up to 10)
   - Click "Generate Image" to create a 5:3 ratio image
   - Click "Download Image" to save the generated image

## Technologies Used

- HTML5
- CSS3 (with Silom font)
- Vanilla JavaScript
- Firebase Realtime Database
- Canvas API for image generation

## Browser Compatibility

Works on all modern browsers that support ES6 modules and Canvas API:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

Free to use for personal and commercial projects.
