// admin.js

// Import fungsi dari Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Ganti dengan konfigurasi Firebase Anda
const firebaseConfig = {
    // ... firebaseConfig Anda
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =======================================================
// Logika Upload ke Cloudinary
// =======================================================
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/duw0uljnq/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'info-klenteng';

const image_upload_handler = (blobInfo, progress) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = false;
    xhr.open('POST', CLOUDINARY_URL);

    xhr.upload.onprogress = (e) => {
        progress(e.loaded / e.total * 100);
    };

    xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
            reject('HTTP Error: ' + xhr.status);
            return;
        }

        const json = JSON.parse(xhr.responseText);

        if (!json || typeof json.secure_url != 'string') {
            reject('Invalid JSON: ' + xhr.responseText);
            return;
        }
        
        // Berhasil! Kembalikan URL gambar ke TinyMCE
        resolve(json.secure_url);
    };

    xhr.onerror = () => {
        reject('Image upload failed due to a XHR Transport error. Code: ' + xhr.status);
    };

    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    xhr.send(formData);
});

// =======================================================
// Inisialisasi TinyMCE
// =======================================================
tinymce.init({
    selector: '#deskripsi',
    plugins: 'image lists link',
    toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | link image',
    
    // Hubungkan fungsi upload kita ke TinyMCE
    images_upload_handler: image_upload_handler
});


// =======================================================
// Logika Simpan ke Firestore
// =======================================================
const klentengForm = document.getElementById('klenteng-form');

klentengForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Mencegah form reload halaman

    // Ambil semua data dari formulir
    const nama = document.getElementById('nama').value;
    const alamat = document.getElementById('alamat').value;
    const kota = document.getElementById('kota').value;
    const provinsi = document.getElementById('provinsi').value;
    const lat = parseFloat(document.getElementById('lat').value); // Ubah ke number
    const lon = parseFloat(document.getElementById('lon').value); // Ubah ke number
    
    // Ambil konten HTML dari TinyMCE
    const deskripsi = tinymce.get('deskripsi').getContent();

    try {
        // Simpan dokumen baru ke collection 'klenteng'
        const docRef = await addDoc(collection(db, "klenteng"), {
            nama: nama,
            alamat: alamat,
            kota: kota,
            provinsi: provinsi,
            lat: lat,
            lon: lon,
            deskripsi: deskripsi,
            // Kita bisa kosongkan imageUrl utama atau isi dengan gambar pertama
            imageUrl: '' 
        });
        
        alert(`Data klenteng berhasil disimpan dengan ID: ${docRef.id}`);
        klentengForm.reset(); // Kosongkan form
        tinymce.get('deskripsi').setContent(''); // Kosongkan TinyMCE
        
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Gagal menyimpan data. Cek konsol untuk detail.");
    }
});
