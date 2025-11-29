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
    
    // Hide sold filter
    document.getElementById('hideSold').addEventListener('change', () => {
        renderPhoneList();
    });
    
    // Sort functionality
    document.getElementById('sortBy').addEventListener('change', () => {
        renderPhoneList();
    });
};

// Render phone list (view-only)
function renderPhoneList() {
    const phoneList = document.getElementById('phoneList');
    const searchTerm = document.getElementById('searchInput').value.trim();
    const showPostpaidOnly = document.getElementById('filterPostpaid').checked;
    const hideSold = document.getElementById('hideSold').checked;
    const sortBy = document.getElementById('sortBy').value;
    
    // Filter phone numbers
    let filteredNumbers = Object.entries(phoneNumbers).filter(([id, data]) => {
        // Search by sequence (exact match anywhere in the number)
        const matchesSearch = searchTerm === '' || data.phoneNumber.includes(searchTerm);
        const matchesPostpaid = !showPostpaidOnly || data.postpaidOnly;
        const matchesSoldFilter = !hideSold || !data.sold;
        return matchesSearch && matchesPostpaid && matchesSoldFilter;
    });

    // Sort numbers
    filteredNumbers.sort(([idA, dataA], [idB, dataB]) => {
        switch (sortBy) {
            case 'newest':
                return (dataB.createdAt || 0) - (dataA.createdAt || 0);
            case 'oldest':
                return (dataA.createdAt || 0) - (dataB.createdAt || 0);
            case 'priceHigh':
                return dataB.price - dataA.price;
            case 'priceLow':
                return dataA.price - dataB.price;
            case 'number':
                return dataA.phoneNumber.localeCompare(dataB.phoneNumber);
            default:
                return 0;
        }
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
