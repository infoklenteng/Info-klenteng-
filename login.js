// login.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Ganti dengan firebaseConfig Anda
const firebaseConfig = {
  apiKey: "AIzaSyD20pmKLS-camDW4Fupu23qwzPK6R1AplY",
  authDomain: "info-klenteng-df46f.firebaseapp.com",
  projectId: "info-klenteng-df46f",
  storageBucket: "info-klenteng-df46f.firebasestorage.app",
  messagingSenderId: "416766280539",
  appId: "1:416766280539:web:c40c1f7903d87b0558507e",
  measurementId: "G-M21P3MZN96"
};


// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Login berhasil, arahkan ke halaman admin
            console.log('Login berhasil:', userCredential.user);
            window.location.replace('admin.html');
        })
        .catch((error) => {
            // Tampilkan pesan error
            console.error('Login gagal:', error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                errorMessage.textContent = 'Email atau password salah.';
            } else {
                errorMessage.textContent = 'Terjadi kesalahan. Coba lagi.';
            }
        });
});
