// admin.js (Versi Lengkap dengan Fitur Edit)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadingMessage.style.display = 'none';
        adminContent.style.display = 'block';
        initCMS(); 
    } else {
        window.location.replace('login.html');
    }
});

function initCMS() {
    let allData = []; // Menyimpan semua data dari Firestore
    const tableBody = document.getElementById('table-body');
    const searchInput = document.getElementById('search-input');
    const klentengForm = document.getElementById('klenteng-form');
    const formTitle = document.getElementById('form-title');
    const docIdInput = document.getElementById('doc-id');
    const clearFormBtn = document.getElementById('clear-form-btn');
    const imageInput = document.getElementById('main-image');
    const currentImageUrlP = document.getElementById('current-image-url');

    // --- FUNGSI UNTUK MEMUAT SEMUA DATA KE TABEL ---
    async function loadAllData() {
        const querySnapshot = await getDocs(collection(db, "klenteng"));
        allData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTable(allData);
    }

    // --- FUNGSI UNTUK MENAMPILKAN DATA DI TABEL ---
    function renderTable(data) {
        tableBody.innerHTML = '';
        data.forEach(item => {
            const row = `
                <tr>
                    <td>${item.nama}</td>
                    <td>${item.kota || 'N/A'}</td>
                    <td>${item.status === 'tayang' ? 'Tayang' : 'Draft'}</td>
                    <td><button class="edit-btn" data-id="${item.id}">Edit</button></td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    // --- EVENT LISTENER UNTUK PENCARIAN ---
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredData = allData.filter(item => item.nama.toLowerCase().includes(searchTerm));
        renderTable(filteredData);
    });

    // --- EVENT LISTENER UNTUK TOMBOL EDIT DI TABEL ---
    tableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const docId = e.target.dataset.id;
            const dataToEdit = allData.find(item => item.id === docId);
            fillFormForEdit(dataToEdit);
        }
    });

    // --- FUNGSI UNTUK MENGISI FORMULIR SAAT EDIT ---
    function fillFormForEdit(data) {
        formTitle.textContent = `Edit: ${data.nama}`;
        docIdInput.value = data.id;
        document.getElementById('nama').value = data.nama || '';
        document.getElementById('alamat').value = data.alamat || '';
        document.getElementById('kota').value = data.kota || '';
        document.getElementById('provinsi').value = data.provinsi || '';
        document.getElementById('lat').value = data.lat || '';
        document.getElementById('lon').value = data.lon || '';
        document.getElementById('status').value = data.status || 'draft';
        tinymce.get('deskripsi').setContent(data.deskripsi || '');
        currentImageUrlP.textContent = `Gambar saat ini: ${data.imageUrl ? data.imageUrl.substring(0, 50) + '...' : 'Tidak ada'}`;
        window.scrollTo(0, document.body.scrollHeight); // Auto scroll ke bawah
    }

    // --- FUNGSI UNTUK MEMBERSIHKAN FORMULIR ---
    function clearForm() {
        formTitle.textContent = 'Tambah Data Baru';
        klentengForm.reset();
        docIdInput.value = '';
        tinymce.get('deskripsi').setContent('');
        currentImageUrlP.textContent = '';
    }
    clearFormBtn.addEventListener('click', clearForm);

    // --- LOGIKA FORM SUBMIT (BISA UNTUK TAMBAH & UPDATE) ---
    klentengForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Menyimpan...';

        const docId = docIdInput.value;
        let imageUrl = allData.find(item => item.id === docId)?.imageUrl || ''; // Ambil URL lama

        const file = imageInput.files[0];
        if (file) {
            imageUrl = await uploadMainImage(file); // Upload jika ada gambar baru
            if (!imageUrl) {
                alert('Upload gambar gagal!');
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
            status: document.getElementById('status').value,
            deskripsi: tinymce.get('deskripsi').getContent(),
            imageUrl: imageUrl
        };

        try {
            if (docId) {
                // Jika ada ID, berarti ini mode UPDATE
                const docRef = doc(db, "klenteng", docId);
                await updateDoc(docRef, dataToSave);
                alert('Data berhasil diperbarui!');
            } else {
                // Jika tidak ada ID, berarti ini mode TAMBAH BARU
                await addDoc(collection(db, "klenteng"), dataToSave);
                alert('Data baru berhasil disimpan!');
            }
            loadAllData(); // Muat ulang tabel
            clearForm(); // Bersihkan form
        } catch (error) {
            console.error("Error saving document: ", error);
            alert("Gagal menyimpan data.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Simpan Data';
        }
    });
    
    // --- FUNGSI UPLOAD & INISIALISASI TINYMCE ---
    const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/duw0uljnq/image/upload';
    const CLOUDINARY_UPLOAD_PRESET = 'info-klenteng';

    async function uploadMainImage(file) { /* ... fungsi ini tetap sama ... */ }
    const tinymce_image_upload_handler = (blobInfo) => new Promise((resolve, reject) => { /* ... fungsi ini tetap sama ... */ });
    
    tinymce.init({
        selector: '#deskripsi',
        plugins: 'image lists link autolink media table',
        toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | link image media table',
        height: 500,
        images_upload_handler: tinymce_image_upload_handler
    });

    // --- PANGGIL FUNGSI AWAL ---
    loadAllData();
}
