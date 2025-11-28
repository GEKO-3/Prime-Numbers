// Global variables
let phoneNumbers = {};
let phonesRef;

// Initialize view page
window.initializeViewPage = function() {
    // Wait for Firebase to be ready
    if (!window.db || !window.dbRef) {
        setTimeout(window.initializeViewPage, 100);
        return;
    }
    
    // Database reference
    phonesRef = window.dbRef(window.db, 'phoneNumbers');
    
    // Load phone numbers from Firebase
    window.dbOnValue(phonesRef, (snapshot) => {
        phoneNumbers = snapshot.val() || {};
        renderPhoneList();
    });

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', () => {
        renderPhoneList();
    });

    // Filter functionality
    document.getElementById('filterPostpaid').addEventListener('change', () => {
        renderPhoneList();
    });
};

// Render phone list (view-only)
function renderPhoneList() {
    const phoneList = document.getElementById('phoneList');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const showPostpaidOnly = document.getElementById('filterPostpaid').checked;
    
    // Filter phone numbers
    const filteredNumbers = Object.entries(phoneNumbers).filter(([id, data]) => {
        const matchesSearch = data.phoneNumber.toLowerCase().includes(searchTerm);
        const matchesPostpaid = !showPostpaidOnly || data.postpaidOnly;
        return matchesSearch && matchesPostpaid;
    });

    if (filteredNumbers.length === 0) {
        phoneList.innerHTML = '<div class="empty-state">No phone numbers found</div>';
        return;
    }

    phoneList.innerHTML = filteredNumbers.map(([id, data]) => {
        return `
            <div class="phone-item view-only ${data.sold ? 'sold' : ''}">
                <div class="phone-number">${data.phoneNumber}</div>
                <div class="phone-price">MVR ${data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                ${data.postpaidOnly ? '<div class="postpaid-badge">Postpaid Only</div>' : ''}
                ${data.sold ? '<div class="sold-badge">SOLD</div>' : ''}
            </div>
        `;
    }).join('');
}
