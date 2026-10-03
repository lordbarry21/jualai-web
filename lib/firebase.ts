// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCGlJ9sz4AdNMmfBmJ9113lf6cNeYnJtWA",
  authDomain: "jualai-b3682.firebaseapp.com",
  projectId: "jualai-b3682",
  storageBucket: "jualai-b3682.firebasestorage.app",
  messagingSenderId: "431482274525",
  appId: "1:431482274525:web:c2921e316a778e8450d134",
  measurementId: "G-REK62YDM47"
};

// Proxy API base URL — point to your Fujitsu server
// The proxy server runs on port 20129 of the Fujitsu machine
// For production: set up a permanent tunnel or use a fixed domain
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:20129';
