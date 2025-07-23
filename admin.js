// admin.js (Versi Lengkap dan Bersih)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Ganti dengan firebaseConfig dari PROYEK BARU Anda
const firebaseConfig = {
  apiKey: "AIzaSyD20pmKLS-camDW4Fupu23qwzPK6R1AplY",
  authDomain: "info-klenteng-df46f.firebaseapp.com",
  projectId: "info-klenteng-df46f",
  storageBucket: "info-klenteng-df46f.firebasestorage.app",
  messagingSenderId: "416766280539",
  appId: "1:416766280539:web:c40c1f7903d87b0558507e",
  measurementId: "G-M21P3MZN96"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const adminContent = document.getElementById('admin-content');
const loadingMessage = document.getElementById('loading-message');

// PENJAGA HALAMAN ADMIN: Cek status login pengguna
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Jika sudah login, tampilkan konten CMS
        loadingMessage.style.display = 'none';
        adminContent.style.display = 'block';
        initCMS(); // Jalankan fungsi utama CMS
    } else {
        // Jika tidak login, alihkan ke halaman login
        window.location.replace('login.html');
    }
});

// Fungsi utama yang menjalankan semua logika CMS setelah login berhasil
function initCMS() {
    // --- KONFIGURASI CLOUDINARY ---
    const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/duw0uljnq/image/upload';
    const CLOUDINARY_UPLOAD_PRESET = 'info-klenteng';

    // --- FUNGSI UNTUK UPLOAD GAMBAR DARI TINYMCE ---
    const tinymce_image_upload_handler = (blobInfo, progress) => new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.withCredentials = false;
        xhr.open('POST', CLOUDINARY_URL);
        xhr.onload = () => {
            if (xhr.status < 200 || xhr.status >= 300) {
                reject('HTTP Error: ' + xhr.status); return;
            }
            const json = JSON.parse(xhr.responseText);
            if (!json || typeof json.secure_url != 'string') {
                reject('Invalid JSON: ' + xhr.responseText); return;
            }
            resolve(json.secure_url);
        };
        xhr.onerror = () => { reject('Image upload failed'); };
        const formData = new FormData();
        formData.append('file', blobInfo.blob(), blobInfo.filename());
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        xhr.send(formData);
    });

    // --- INISIALISASI TINYMCE ---
    tinymce.init({
        selector: '#deskripsi',
        plugins: 'image lists link autolink',
        toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | link image',
        height: 500,
        images_upload_handler: tinymce_image_upload_handler
    });

    // --- FUNGSI UNTUK UPLOAD GAMBAR UTAMA ---
    async function uploadMainImage(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        try {
            const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Upload gagal');
            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error('Gagal upload gambar utama:', error);
            return null;
        }
    }

    // --- LOGIKA FORM SUBMIT ---
    const klentengForm = document.getElementById('klenteng-form');
    const imageInput = document.getElementById('main-image');

    klentengForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Menyimpan...';

        const file = imageInput.files[0];
        let imageUrl = '';

        if (file) {
            imageUrl = await uploadMainImage(file);
            if (!imageUrl) {
                alert('Upload gambar utama gagal. Proses dibatalkan.');
                submitButton.disabled = false;
                submitButton.textContent = 'Simpan Data';
                return;
            }
        }

        const dataToSave = {
            nama: document.getElementById('nama').value,
            alamat: document.getElementById('alamat').value,
            kota: document.getElementById('kota').value,
            provinsi: document.getElementById('provinsi').value,
            lat: parseFloat(document.getElementById('lat').value),
            lon: parseFloat(document.getElementById('lon').value),
            deskripsi: tinymce.get('deskripsi').getContent(),
            imageUrl: imageUrl
        };

        try {
            await addDoc(collection(db, "klenteng"), dataToSave);
            alert('Data klenteng berhasil disimpan!');
            klentengForm.reset();
            tinymce.get('deskripsi').setContent('');
        } catch (error) {
            console.error("Error saat menyimpan ke Firestore: ", error);
            alert("Gagal menyimpan data. Cek konsol untuk detail.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Simpan Data';
        }
    });
}
