// 1. Firebase Configuration (আপনার ফায়ারবেস কনসোল থেকে প্রজেক্ট সেটিংসে গিয়ে এটি পাবেন)
const firebaseConfig = {
    apiKey: "AIzaSyD9Q2CT4bGYaGqs4uYHiROZRngfw2ZvPx0",
    authDomain: "bangla-caption-box.firebaseapp.com",
    projectId: "bangla-caption-box",
    storageBucket: "bangla-caption-box.firebasestorage.app",
    messagingSenderId: "316786933376",
    appId: "1:316786933376:android:9c391c5930f0b0bc6bb065"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Tab Switching System
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// ----------------------------------------------------
// 2. CATEGORIES MANAGEMENT
// ----------------------------------------------------
const categoryForm = document.getElementById('categoryForm');
const categoryNameInput = document.getElementById('categoryName');
const categoryListUi = document.getElementById('categoryList');
const categorySelectDropdown = document.getElementById('categorySelect');

// Load Categories
function loadCategories() {
    db.collection('categories').onSnapshot(snapshot => {
        categoryListUi.innerHTML = '';
        categorySelectDropdown.innerHTML = '<option value="">ক্যাটাগরি সিলেক্ট করুন...</option>';

        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;

            // Update UI List
            const li = document.createElement('li');
            li.innerHTML = `
                <span><strong>${data.name}</strong> (ID: ${id})</span>
                <button onclick="deleteCategory('${id}')" class="btn btn-danger"><i class="fa-solid fa-trash"></i></button>
            `;
            categoryListUi.appendChild(li);

            // Update Select Dropdown
            const option = document.createElement('option');
            option.value = id;
            option.textContent = data.name;
            categorySelectDropdown.appendChild(option);
        });
    });
}

// Add Category
categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = categoryNameInput.value.trim();
    if (!name) return;

    try {
        await db.collection('categories').add({
            name: name,
            createdAt: Date.now()
        });
        categoryNameInput.value = '';
        alert('ক্যাটাগরি সফলভাবে যোগ হয়েছে!');
    } catch (err) {
        alert('এরর: ' + err.message);
    }
});

// Delete Category
async function deleteCategory(id) {
    if (confirm('আপনি কি নিশ্চিত যে এই ক্যাটাগরিটি মুছে ফেলতে চান?')) {
        await db.collection('categories').doc(id).delete();
    }
}

// ----------------------------------------------------
// 3. CAPTIONS MANAGEMENT
// ----------------------------------------------------
const captionForm = document.getElementById('captionForm');
const captionTextInput = document.getElementById('captionText');
const captionsTableBody = document.getElementById('captionsTableBody');
const editCaptionIdInput = document.getElementById('editCaptionId');

// Load Captions
function loadCaptions() {
    db.collection('captions').onSnapshot(snapshot => {
        captionsTableBody.innerHTML = '';

        if (snapshot.empty) {
            captionsTableBody.innerHTML = '<tr><td colspan="4">কোনো ক্যাপশন পাওয়া যায়নি।</td></tr>';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${data.text}</td>
                <td><small>${data.categoryId}</small></td>
                <td><span style="color: green; font-weight: bold;">${data.status}</span></td>
                <td>
                    <button onclick="editCaption('${id}', '${data.categoryId}', \`${data.text}\`)" class="btn btn-primary"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteCaption('${id}')" class="btn btn-danger"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            captionsTableBody.appendChild(tr);
        });
    });
}

// Add or Update Caption
captionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const catId = categorySelectDropdown.value;
    const text = captionTextInput.value.trim();
    const editId = editCaptionIdInput.value;

    if (!catId || !text) return;

    try {
        if (editId) {
            // Update Existing Caption
            await db.collection('captions').doc(editId).update({
                categoryId: catId,
                text: text
            });
            editCaptionIdInput.value = '';
            alert('ক্যাপশন আপডেট হয়েছে!');
        } else {
            // Create New Caption
            await db.collection('captions').add({
                categoryId: catId,
                text: text,
                status: 'published',
                createdAt: Date.now()
            });
            alert('ক্যাপশন সফলভাবে পোস্ট হয়েছে!');
        }
        captionTextInput.value = '';
    } catch (err) {
        alert('এরর: ' + err.message);
    }
});

// Edit Caption Helper
function editCaption(id, categoryId, text) {
    editCaptionIdInput.value = id;
    categorySelectDropdown.value = categoryId;
    captionTextInput.value = text;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Delete Caption
async function deleteCaption(id) {
    if (confirm('ক্যাপশনটি ডিলিট করতে চান?')) {
        await db.collection('captions').doc(id).delete();
    }
}

// ----------------------------------------------------
// 4. APP IN-APP UPDATE CONTROL
// ----------------------------------------------------
const updateConfigForm = document.getElementById('updateConfigForm');
const latestVersionCodeInput = document.getElementById('latestVersionCode');
const latestVersionNameInput = document.getElementById('latestVersionName');
const apkDownloadUrlInput = document.getElementById('apkDownloadUrl');
const releaseNotesInput = document.getElementById('releaseNotes');

// Load Current Update Config
function loadUpdateConfig() {
    db.collection('app_config').doc('update_info').get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            latestVersionCodeInput.value = data.versionCode || '';
            latestVersionNameInput.value = data.versionName || '';
            apkDownloadUrlInput.value = data.downloadUrl || '';
            releaseNotesInput.value = data.releaseNotes || '';
        }
    });
}

// Save Update Config
updateConfigForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await db.collection('app_config').doc('update_info').set({
            versionCode: parseInt(latestVersionCodeInput.value),
            versionName: latestVersionNameInput.value.trim(),
            downloadUrl: apkDownloadUrlInput.value.trim(),
            releaseNotes: releaseNotesInput.value.trim(),
            updatedAt: Date.now()
        });
        alert('ইন-অ্যাপ আপডেট কনফিগারেশন সেভ হয়েছে!');
    } catch (err) {
        alert('এরর: ' + err.message);
    }
});

// Initialize Everything On Load
window.onload = () => {
    loadCategories();
    loadCaptions();
    loadUpdateConfig();
};