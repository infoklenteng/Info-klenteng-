// admin.js (Versi Baru dengan Proteksi)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const adminContent = document.getElementById('admin-content');
const loadingMessage = document.getElementById('loading-message');

// =======================================================
// FUNGSI UNTUK UPLOAD GAMBAR UTAMA KE CLOUDINARY
// =======================================================
async function uploadImage(file) {
    const cloudName = 'duw0uljnq'; // Diambil dari info Anda
    const uploadPreset = 'info-klenteng'; // Diambil dari info Anda
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Gagal mengupload gambar.');
        }

        const data = await response.json();
        return data.secure_url; // Mengembalikan URL gambar yang aman
    
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return null;
    }
}


// ... (kode onAuthStateChanged dan initCMS Anda) ...

// Di dalam fungsi initCMS(), modifikasi event listener untuk form
function initCMS() {
    // ... (kode TinyMCE Anda tetap sama) ...

    const klentengForm = document.getElementById('klenteng-form');
    const imageInput = document.getElementById('main-image');

    klentengForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Ambil file yang dipilih oleh pengguna
        const file = imageInput.files[0];
        let imageUrl = ''; // Siapkan variabel untuk URL gambar

        if (file) {
            // Jika ada file yang dipilih, upload dulu
            alert('Mengupload gambar utama...');
            imageUrl = await uploadImage(file);
            if (!imageUrl) {
                alert('Upload gambar utama gagal. Proses dibatalkan.');
                return; // Hentikan proses jika upload gagal
            }
            alert('Upload gambar utama berhasil!');
        }

        // Ambil data lain dari form
        const nama = document.getElementById('nama').value;
        const alamat = document.getElementById('alamat').value;
        const kota = document.getElementById('kota').value;
        const provinsi = document.getElementById('provinsi').value;
        const lat = parseFloat(document.getElementById('lat').value);

        const lon = parseFloat(document.getElementById('lon').value);
        const deskripsi = tinymce.get('deskripsi').getContent();

        try {
            // Simpan dokumen baru dengan URL gambar dari Cloudinary
            const docRef = await addDoc(collection(db, "klenteng"), {
                nama,
                alamat,
                kota,
                provinsi,
                lat,
                lon,
                deskripsi,
                imageUrl: imageUrl // Gunakan URL dari Cloudinary
            });
            
            alert(`Data klenteng berhasil disimpan dengan ID: ${docRef.id}`);
            klentengForm.reset();
            tinymce.get('deskripsi').setContent('');
            
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Gagal menyimpan data.");
        }
    });
}

// =======================================================
// PENJAGA HALAMAN ADMIN
// =======================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Pengguna sudah login, tampilkan konten CMS
        console.log('Pengguna terautentikasi:', user.email);
        loadingMessage.style.display = 'none';
        adminContent.style.display = 'block';
        
        // Inisialisasi semua logika CMS di sini
        initCMS();

    } else {
        // Pengguna tidak login, tendang ke halaman login
        console.log('Pengguna tidak terautentikasi, mengarahkan ke login.html');
        window.location.replace('login.html');
    }
});


// =======================================================
// Fungsi untuk menjalankan semua logika CMS
// =======================================================
function initCMS() {
    const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/duw0uljnq/image/upload';
    const CLOUDINARY_UPLOAD_PRESET = 'info-klenteng';

    const image_upload_handler = (blobInfo, progress) => new Promise((resolve, reject) => {
        // ... (fungsi upload cloudinary tetap sama seperti sebelumnya) ...
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
        xhr.onerror = () => { reject('Image upload failed due to a XHR Transport error. Code: ' + xhr.status); };
        const formData = new FormData();
        formData.append('file', blobInfo.blob(), blobInfo.filename());
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        xhr.send(formData);
    });

    tinymce.init({
        selector: '#deskripsi',
        plugins: 'image lists link',
        toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | link image',
        images_upload_handler: image_upload_handler
    });

    const klentengForm = document.getElementById('klenteng-form');
    klentengForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nama = document.getElementById('nama').value;
        const alamat = document.getElementById('alamat').value;
        const kota = document.getElementById('kota').value;
        const provinsi = document.getElementById('provinsi').value;
        const lat = parseFloat(document.getElementById('lat').value);
        const lon = parseFloat(document.getElementById('lon').value);
        const deskripsi = tinymce.get('deskripsi').getContent();

        try {
            const docRef = await addDoc(collection(db, "klenteng"), {
                nama, alamat, kota, provinsi, lat, lon, deskripsi, imageUrl: ''
            });
            alert(`Data klenteng berhasil disimpan dengan ID: ${docRef.id}`);
            klentengForm.reset();
            tinymce.get('deskripsi').setContent('');
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Gagal menyimpan data.");
        }
    });
}
