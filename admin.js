// admin.js (Versi Lengkap dengan Aksi Massal)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// --- IMPOR FUNGSI BARU: writeBatch ---
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, orderBy, query, limit, startAfter, getDocs, where, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// PENJAGA HALAMAN ADMIN
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runAdmin);
        } else {
            runAdmin();
        }
    } else {
        window.location.replace('login.html');
    }
});

function runAdmin() {
    document.getElementById('loading-message').style.display = 'none';
    document.getElementById('admin-content').style.display = 'block';
    initCMS();
}

function initCMS() {
    let currentDataOnPage = [];
    let firstVisibleDoc = null;
    let lastVisibleDoc = null;
    let pageHistory = [null];
    const itemsPerPage = 25;

    const tableBody = document.getElementById('table-body');
    const searchInput = document.getElementById('search-input');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const klentengForm = document.getElementById('klenteng-form');
    const formTitle = document.getElementById('form-title');
    const docIdInput = document.getElementById('doc-id');
    const clearFormBtn = document.getElementById('clear-form-btn');
    const imageInput = document.getElementById('main-image');
    const currentImageUrlP = document.getElementById('current-image-url');
    const submitButton = klentengForm.querySelector('button[type="submit"]');

    // === ELEMEN BARU UNTUK AKSI MASSAL ===
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
    const bulkPublishBtn = document.getElementById('bulk-publish-btn');

    // --- LOGIKA PAGINASI ---
    async function loadData(direction = 'initial') {
        let q;
        const klentengCollection = collection(db, "klenteng");

        if (direction === 'next') {
            q = query(klentengCollection, orderBy("nama"), startAfter(lastVisibleDoc), limit(itemsPerPage));
        } else if (direction === 'prev') {
            pageHistory.pop();
            const previousPageStart = pageHistory[pageHistory.length - 1];
            q = query(klentengCollection, orderBy("nama"), startAfter(previousPageStart), limit(itemsPerPage));
        } else {
            pageHistory = [null];
            q = query(klentengCollection, orderBy("nama"), limit(itemsPerPage));
        }

        const querySnapshot = await getDocs(q);
        currentDataOnPage = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (!querySnapshot.empty) {
            firstVisibleDoc = querySnapshot.docs[0];
            lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            if (direction === 'next') pageHistory.push(firstVisibleDoc);
        }
        
        renderTable(currentDataOnPage);
        updatePaginationButtons(querySnapshot);
    }

    function updatePaginationButtons(snapshot) {
        const isSearching = searchInput.value.trim() !== '';
        nextBtn.disabled = snapshot.size < itemsPerPage || isSearching;
        prevBtn.disabled = pageHistory.length <= 1 || isSearching;
    }
    
    nextBtn.addEventListener('click', () => loadData('next'));
    prevBtn.addEventListener('click', () => loadData('prev'));

    // --- FUNGSI UNTUK MENAMPILKAN DATA DI TABEL ---
    function renderTable(data) {
        tableBody.innerHTML = '';
        selectAllCheckbox.checked = false; // Reset checkbox utama
        updateBulkActionButtonsState(); // Nonaktifkan tombol aksi

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Data tidak ditemukan.</td></tr>`;
            return;
        }
        data.forEach(item => {
            const row = `
                <tr>
                    <td><input type="checkbox" class="row-checkbox" data-id="${item.id}"></td>
                    <td>${item.nama}</td>
                    <td>${item.kota || 'N/A'}</td>
                    <td>${item.status === 'tayang' ? 'Tayang' : 'Draft'}</td>
                    <td>
                        <button class="edit-btn" data-id="${item.id}">Edit</button>
                        <button class="delete-btn" data-id="${item.id}">Hapus</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    // --- LOGIKA AKSI MASSAL ---

    // Fungsi untuk mengupdate status tombol aksi massal
    function updateBulkActionButtonsState() {
        const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
        const allCheckboxes = document.querySelectorAll('.row-checkbox');
        const hasSelection = selectedCheckboxes.length > 0;
        
        bulkDeleteBtn.disabled = !hasSelection;
        bulkPublishBtn.disabled = !hasSelection;
        
        // Update checkbox "pilih semua"
        if (allCheckboxes.length > 0 && selectedCheckboxes.length === allCheckboxes.length) {
            selectAllCheckbox.checked = true;
        } else {
            selectAllCheckbox.checked = false;
        }
    }

    // Event listener untuk checkbox "pilih semua"
    selectAllCheckbox.addEventListener('change', () => {
        document.querySelectorAll('.row-checkbox').forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
        updateBulkActionButtonsState();
    });

    // Event listener untuk perubahan pada checkbox di dalam tabel
    tableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('row-checkbox')) {
            updateBulkActionButtonsState();
        }
    });

    // Fungsi untuk mendapatkan ID yang dipilih
    function getSelectedIds() {
        return Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.dataset.id);
    }
    
    // Event listener untuk tombol Hapus Massal
    bulkDeleteBtn.addEventListener('click', async () => {
        const idsToDelete = getSelectedIds();
        if (idsToDelete.length === 0) return;

        if (confirm(`Anda yakin ingin menghapus ${idsToDelete.length} item terpilih?`)) {
            const batch = writeBatch(db);
            idsToDelete.forEach(id => {
                const docRef = doc(db, "klenteng", id);
                batch.delete(docRef);
            });
            try {
                await batch.commit();
                alert(`${idsToDelete.length} item berhasil dihapus.`);
                loadData('initial');
            } catch (error) {
                console.error("Error deleting documents in batch: ", error);
                alert("Gagal menghapus item terpilih.");
            }
        }
    });

    // Event listener untuk tombol Tayangkan Massal
    bulkPublishBtn.addEventListener('click', async () => {
        const idsToPublish = getSelectedIds();
        if (idsToPublish.length === 0) return;
        
        if (confirm(`Anda yakin ingin menayangkan ${idsToPublish.length} item terpilih?`)) {
            const batch = writeBatch(db);
            idsToPublish.forEach(id => {
                const docRef = doc(db, "klenteng", id);
                batch.update(docRef, { status: 'tayang' });
            });
            try {
                await batch.commit();
                alert(`${idsToPublish.length} item berhasil ditayangkan.`);
                loadData('initial');
            } catch (error) {
                console.error("Error updating documents in batch: ", error);
                alert("Gagal menayangkan item terpilih.");
            }
        }
    });


    // --- FUNGSI PENCARIAN ---
    async function performSearch(searchTerm) {
        if (!searchTerm) {
            loadData('initial');
            return;
        }
        const klentengCollection = collection(db, "klenteng");
        const q = query(klentengCollection, where("nama", ">=", searchTerm), where("nama", "<=", searchTerm + '\uf8ff'), orderBy("nama"));
        const querySnapshot = await getDocs(q);
        const searchResults = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        currentDataOnPage = searchResults;
        renderTable(searchResults);
        prevBtn.disabled = true;
        nextBtn.disabled = true;
    }

    searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value.trim());
    });


    // --- EVENT LISTENER UNTUK TOMBOL EDIT DAN HAPUS SATUAN ---
    tableBody.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.classList.contains('edit-btn')) {
            const docId = target.dataset.id;
            const dataToEdit = currentDataOnPage.find(item => item.id === docId);
            if (dataToEdit) fillFormForEdit(dataToEdit);
        }
        if (target.classList.contains('delete-btn')) {
            const docId = target.dataset.id;
            const dataToDelete = currentDataOnPage.find(item => item.id === docId);
            if (confirm(`Yakin ingin menghapus data "${dataToDelete.nama}" secara permanen?`)) {
                try {
                    await deleteDoc(doc(db, "klenteng", docId));
                    alert('Data berhasil dihapus!');
                    loadData('initial');
                    clearForm();
                } catch (error) {
                    console.error("Error deleting document: ", error);
                    alert("Gagal menghapus data.");
                }
            }
        }
    });
    
    // ... (Sisa fungsi CMS seperti fillFormForEdit, clearForm, submit, upload, dan tinymce tetap sama) ...
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
        submitButton.textContent = 'Update Data';
        klentengForm.scrollIntoView({ behavior: 'smooth' });
    }

    function clearForm() {
        formTitle.textContent = 'Tambah Data Baru';
        klentengForm.reset();
        docIdInput.value = '';
        tinymce.get('deskripsi').setContent('');
        currentImageUrlP.textContent = '';
        submitButton.textContent = 'Simpan Data';
    }
    clearFormBtn.addEventListener('click', clearForm);

    klentengForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = 'Menyimpan...';

        const docId = docIdInput.value;
        let imageUrl = docId ? (currentDataOnPage.find(item => item.id === docId)?.imageUrl || '') : '';

        const file = imageInput.files[0];
        if (file) {
            imageUrl = await uploadMainImage(file);
            if (!imageUrl) {
                alert('Upload gambar gagal!');
                submitButton.disabled = false;
                submitButton.textContent = docId ? 'Update Data' : 'Simpan Data';
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
                const docRef = doc(db, "klenteng", docId);
                await updateDoc(docRef, dataToSave);
                alert('Data berhasil diperbarui!');
            } else {
                await addDoc(collection(db, "klenteng"), dataToSave);
                alert('Data baru berhasil disimpan!');
            }
            searchInput.value = '';
            await loadData('initial');
            clearForm();
        } catch (error) {
            console.error("Error saving document: ", error);
            alert("Gagal menyimpan data.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = docId ? 'Update Data' : 'Simpan Data';
        }
    });

    const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/duw0uljnq/image/upload';
    const CLOUDINARY_UPLOAD_PRESET = 'info-klenteng';

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

    const tinymce_image_upload_handler = (blobInfo) => new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', blobInfo.blob(), blobInfo.filename());
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        fetch(CLOUDINARY_URL, { method: 'POST', body: formData })
            .then(response => response.json())
            .then(result => {
                if (result.secure_url) {
                    resolve(result.secure_url);
                } else {
                    reject('Upload gagal: ' + JSON.stringify(result));
                }
            })
            .catch((error) => reject('Upload gagal: ' + error));
    });
    
    tinymce.init({
        selector: '#deskripsi',
        plugins: 'image lists link autolink media table',
        toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | link image media table',
        height: 500,
        images_upload_handler: tinymce_image_upload_handler
    });

    // --- PANGGIL FUNGSI AWAL ---
    loadData('initial');
}
