// Firebase Configuration
export const firebaseConfig = {
    apiKey: "AIzaSyBsaGVY8Y8NuCXJPtsMavwLVJV2_RTyIPU",
    authDomain: "prime-number-93521.firebaseapp.com",
    databaseURL: "https://prime-number-93521-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "prime-number-93521",
    storageBucket: "prime-number-93521.firebasestorage.app",
    messagingSenderId: "1087890506780",
    appId: "1:1087890506780:web:1be4a09684778f2b774bd9"
};

/*
SETUP INSTRUCTIONS:

1. Go to https://console.firebase.google.com/
2. Create a new project or select an existing one
3. Click on "Realtime Database" in the left menu
4. Click "Create Database"
5. Choose your location and start in "test mode" (you can configure rules later)
6. Go to Project Settings (gear icon) > General > Your apps
7. Click on the "</>" (Web) icon to add a web app
8. Register your app with a nickname (e.g., "Prime Numbers Web")
9. Copy the firebaseConfig object values and replace them above
10. Make sure to keep your API key secure in production

SECURITY RULES (Optional - for production):
In Firebase Console > Realtime Database > Rules, you can set:

{
  "rules": {
    "phoneNumbers": {
      ".read": true,
      ".write": true
    }
  }
}

For better security, consider adding authentication and restricting write access.
*/
