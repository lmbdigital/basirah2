// Import the functions you need from the SDKs you need
    import { initializeApp } from "firebase/app";
    import { getAnalytics } from "firebase/analytics";
    import { getAuth } from "firebase/auth";
    import { getFirestore } from "firebase/firestore";
    // TODO: Add SDKs for Firebase products that you want to use
    // https://firebase.google.com/docs/web/setup#available-libraries

    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
      apiKey: "AIzaSyDvlCW4g5k6Q28jcWeZqDHWLYxM3oUxSIs",
      authDomain: "brandpulseanalytix.firebaseapp.com",
      projectId: "brandpulseanalytix",
      storageBucket: "brandpulseanalytix.firebasestorage.app",
      messagingSenderId: "316499088401",
      appId: "1:316499088401:web:3f29efe07f7b73a69ccdb0",
      measurementId: "G-JHDX7YR2XL"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
    const auth = getAuth(app);
    const db = getFirestore(app);

    export { app, auth, db };
