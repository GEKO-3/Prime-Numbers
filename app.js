// Global variables
let phoneNumbers = {};
let selectedNumbers = new Set();
let phonesRef;

// Initialize app
window.initializeApp = function() {
    // Wait for Firebase to be ready
    if (!window.db || !window.dbRef) {
        setTimeout(window.initializeApp, 100);
        return;
    }
    
    // Database reference
    phonesRef = window.dbRef(window.db, 'phoneNumbers');
    // Load phone numbers from Firebase
    window.dbOnValue(phonesRef, (snapshot) => {
        phoneNumbers = snapshot.val() || {};
        renderPhoneList();
    });

    // Form submissions
    document.getElementById('phoneForm').addEventListener('submit', addPhoneNumber);
    document.getElementById('bulkForm').addEventListener('submit', addBulkNumbers);

    // Auto-fill bulk inputs on paste
    const firstBulkNumber = document.querySelector('.bulk-number');
    if (firstBulkNumber) {
        firstBulkNumber.addEventListener('paste', handleBulkPaste);
    }

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const category = document.getElementById('categoryFilter').value;
        renderPhoneList(e.target.value, category);
    });

    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        const search = document.getElementById('searchInput').value;
        renderPhoneList(search, e.target.value);
    });

    // Generate image button
    document.getElementById('generateBtn').addEventListener('click', generateImage);

    // Download button
    document.getElementById('downloadBtn').addEventListener('click', downloadImage);
}

// Handle paste of multiple numbers in bulk form
function handleBulkPaste(e) {
    e.preventDefault();
    
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const numbers = pastedText
        .split(/[\n\r]+/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 5); // Max 5 numbers
    
    if (numbers.length > 0) {
        const bulkNumberInputs = document.querySelectorAll('.bulk-number');
        numbers.forEach((number, index) => {
            if (bulkNumberInputs[index]) {
                bulkNumberInputs[index].value = number;
            }
        });
        
        // Focus on first price field
        const firstPriceInput = document.querySelector('.bulk-price');
        if (firstPriceInput) {
            firstPriceInput.focus();
        }
    }
}

// Clean phone number (remove country code and non-digits)
function cleanPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Remove Maldives country code (960) if present at the beginning
    if (cleaned.startsWith('960') && cleaned.length > 7) {
        cleaned = cleaned.substring(3);
    }
    
    return cleaned;
}

// Add phone number
function addPhoneNumber(e) {
    e.preventDefault();

    const phoneNumber = cleanPhoneNumber(document.getElementById('phoneNumber').value.trim());
    const price = parseFloat(document.getElementById('price').value);
    const category = document.getElementById('category').value;
    const postpaidOnly = document.getElementById('postpaidOnly').checked;
    const sold = document.getElementById('soldStatus').checked;

    if (!phoneNumber || !price) {
        alert('Please fill in all fields');
        return;
    }

    // Check if phone number already exists
    const existingNumber = Object.values(phoneNumbers).find(
        data => data.phoneNumber === phoneNumber
    );
    
    if (existingNumber) {
        alert('This phone number already exists in the database!');
        return;
    }

    // Add to Firebase
    window.dbPush(phonesRef, {
        phoneNumber: phoneNumber,
        price: price,
        category: category || null,
        postpaidOnly: postpaidOnly,
        sold: sold,
        createdAt: Date.now()
    });

    // Clear form
    document.getElementById('phoneForm').reset();
    document.getElementById('phoneNumber').focus();
}

// Add bulk numbers
function addBulkNumbers(e) {
    e.preventDefault();

    const category = document.getElementById('bulkCategory').value;
    const postpaidOnly = document.getElementById('bulkPostpaidOnly').checked;

    // Collect all number-price pairs
    const entries = [];
    const bulkNumbers = document.querySelectorAll('.bulk-number');
    const bulkPrices = document.querySelectorAll('.bulk-price');

    for (let i = 0; i < bulkNumbers.length; i++) {
        const number = bulkNumbers[i].value.trim();
        const price = bulkPrices[i].value.trim();

        if (number && price) {
            const cleanedNumber = cleanPhoneNumber(number);
            const priceValue = parseFloat(price);

            if (!cleanedNumber) {
                alert(`Invalid phone number at position ${i + 1}`);
                return;
            }

            if (isNaN(priceValue) || priceValue <= 0) {
                alert(`Invalid price at position ${i + 1}`);
                return;
            }

            entries.push({
                phoneNumber: cleanedNumber,
                price: priceValue
            });
        }
    }

    if (entries.length === 0) {
        alert('Please enter at least one phone number with price');
        return;
    }

    // Check for duplicates within the batch
    const numbers = entries.map(e => e.phoneNumber);
    const uniqueNumbers = [...new Set(numbers)];
    if (uniqueNumbers.length !== numbers.length) {
        alert('Duplicate numbers found in your entries!');
        return;
    }

    // Check for existing numbers in database
    const existingNumbers = entries.filter(entry => 
        Object.values(phoneNumbers).some(data => data.phoneNumber === entry.phoneNumber)
    );

    if (existingNumbers.length > 0) {
        alert(`These numbers already exist:\n${existingNumbers.map(e => e.phoneNumber).join('\n')}`);
        return;
    }

    // Add all numbers
    entries.forEach(entry => {
        window.dbPush(phonesRef, {
            phoneNumber: entry.phoneNumber,
            price: entry.price,
            category: category || null,
            postpaidOnly: postpaidOnly,
            sold: false,
            createdAt: Date.now()
        });
    });

    alert(`Successfully added ${entries.length} phone numbers!`);

    // Clear form
    document.getElementById('bulkForm').reset();
    bulkNumbers[0].focus();
}

// Render phone list
function renderPhoneList(searchTerm = '', categoryFilter = '') {
    const phoneList = document.getElementById('phoneList');
    
    // Filter phone numbers
    const filteredNumbers = Object.entries(phoneNumbers).filter(([id, data]) => {
        const matchesSearch = data.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !categoryFilter || 
            (categoryFilter === 'none' && !data.category) ||
            (data.category === categoryFilter);
        return matchesSearch && matchesCategory;
    });

    if (filteredNumbers.length === 0) {
        phoneList.innerHTML = '<div class="empty-state">No phone numbers found</div>';
        return;
    }

    phoneList.innerHTML = filteredNumbers.map(([id, data]) => {
        const isSelected = selectedNumbers.has(id);
        return `
            <div class="phone-item ${isSelected ? 'selected' : ''} ${data.sold ? 'sold' : ''}" onclick="toggleSelection('${id}')">
                <div class="phone-number">
                    ${data.phoneNumber}
                    <button class="btn-copy" onclick="copyPhoneNumber(event, '${data.phoneNumber}')" title="Copy number">📋</button>
                </div>
                <div class="phone-price">MVR ${data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                ${data.category ? `<div class="category-badge category-${data.category.toLowerCase()}">${data.category}</div>` : ''}
                ${data.postpaidOnly ? '<div class="postpaid-badge">Postpaid Only</div>' : ''}
                ${data.inImage ? '<div class="image-badge">In Image</div>' : ''}
                ${data.sold ? `<div class="sold-badge">SOLD${data.customerName ? ' - ' + data.customerName : ''}</div>` : ''}
                <div class="phone-actions">
                    <button class="btn-edit" onclick="editPhoneNumber(event, '${id}')">Edit</button>
                    <button class="btn-delete" onclick="deletePhoneNumber(event, '${id}')">Delete</button>
                    ${!data.sold ? `<button class="btn-sold" onclick="markAsSold(event, '${id}')">Mark Sold</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Toggle selection
function toggleSelection(id) {
    if (selectedNumbers.has(id)) {
        selectedNumbers.delete(id);
    } else {
        if (selectedNumbers.size >= 10) {
            alert('You can only select up to 10 numbers');
            return;
        }
        selectedNumbers.add(id);
    }
    
    renderPhoneList(document.getElementById('searchInput').value);
    updateSelectedList();
}

// Update selected list
function updateSelectedList() {
    const selectedList = document.getElementById('selectedList');
    const selectedCount = document.getElementById('selectedCount');
    const generateBtn = document.getElementById('generateBtn');

    selectedCount.textContent = selectedNumbers.size;
    generateBtn.disabled = selectedNumbers.size === 0;

    if (selectedNumbers.size === 0) {
        selectedList.innerHTML = '<div class="empty-state" style="padding: 10px;">No numbers selected</div>';
        return;
    }

    selectedList.innerHTML = Array.from(selectedNumbers).map(id => {
        const data = phoneNumbers[id];
        return `
            <div class="selected-tag">
                ${data.phoneNumber} - MVR ${data.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                <button class="remove-tag" onclick="toggleSelection('${id}')">×</button>
            </div>
        `;
    }).join('');
}

// Edit phone number
// Store current edit ID
let currentEditId = null;

function editPhoneNumber(event, id) {
    event.stopPropagation();
    
    const data = phoneNumbers[id];
    currentEditId = id;
    
    // Populate form with current data
    document.getElementById('editPhoneNumber').value = data.phoneNumber;
    document.getElementById('editPrice').value = data.price;
    document.getElementById('editCategory').value = data.category || '';
    document.getElementById('editPostpaidOnly').checked = data.postpaidOnly || false;
    document.getElementById('editSold').checked = data.sold || false;
    
    // Show modal
    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditId = null;
}

function saveEdit(event) {
    event.preventDefault();
    
    if (!currentEditId) return;
    
    const phoneNumber = document.getElementById('editPhoneNumber').value.trim();
    const price = parseFloat(document.getElementById('editPrice').value);
    const category = document.getElementById('editCategory').value;
    const postpaidOnly = document.getElementById('editPostpaidOnly').checked;
    const sold = document.getElementById('editSold').checked;
    
    // Update in Firebase
    const phoneRef = window.dbRef(window.db, `phoneNumbers/${currentEditId}`);
    window.dbUpdate(phoneRef, {
        phoneNumber: phoneNumber,
        price: price,
        category: category || null,
        postpaidOnly: postpaidOnly,
        sold: sold
    });
    
    closeEditModal();
}

// Make functions globally accessible
window.closeEditModal = closeEditModal;
window.saveEdit = saveEdit;

// Mark as sold
function markAsSold(event, id) {
    event.stopPropagation();
    
    const customerName = prompt('Enter customer name:');
    
    if (customerName !== null && customerName.trim() !== '') {
        const phoneRef = window.dbRef(window.db, `phoneNumbers/${id}`);
        window.dbUpdate(phoneRef, {
            sold: true,
            customerName: customerName.trim(),
            soldDate: Date.now()
        });
    }
}

// Delete phone number
function deletePhoneNumber(event, id) {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this phone number?')) {
        const phoneRef = window.dbRef(window.db, `phoneNumbers/${id}`);
        window.dbRemove(phoneRef);
        
        // Remove from selected if it was selected
        selectedNumbers.delete(id);
        updateSelectedList();
    }
}

// Generate image (3:5 portrait ratio for social media)
function generateImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size (3:5 ratio) - 1080x1800 for social media
    canvas.width = 1080;
    canvas.height = 1800;
    
    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Load and draw logo
    const logoImg = new Image();
    logoImg.src = 'prime numbers profile.svg';
    
    logoImg.onload = () => {
        // Draw logo at top center
        const logoSize = 150;
        const logoY = 80;
        ctx.drawImage(logoImg, (canvas.width - logoSize) / 2, logoY, logoSize, logoSize);
        
        // Get selected phone numbers
        const selected = Array.from(selectedNumbers).map(id => phoneNumbers[id]);
        const maxItems = Math.min(selected.length, 10);
        
        // Calculate spacing
        const itemHeight = 120;
        const totalHeight = maxItems * itemHeight;
        const startY = (canvas.height - totalHeight) / 2 + 100;
        
        // Draw phone numbers
        selected.slice(0, maxItems).forEach((data, index) => {
            const y = startY + (index * itemHeight);
            
            // Phone number (white, bold, centered)
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 60px Silom, Monaco, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(data.phoneNumber, canvas.width / 2, y);
            
            // Price (gray, smaller, centered below number)
            ctx.fillStyle = '#999999';
            ctx.font = '35px Silom, Monaco, monospace';
            ctx.textAlign = 'center';
            const priceText = `MVR ${data.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            ctx.fillText(priceText, canvas.width / 2, y + 50);
        });
        
        // Display canvas
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.innerHTML = '';
        imagePreview.appendChild(canvas);
        
        // Show download button
        document.getElementById('downloadBtn').style.display = 'block';
    };
    
    logoImg.onerror = () => {
        // If logo fails to load, continue without it
        drawImageWithoutLogo(canvas, ctx);
    };
}

// Draw image without logo (fallback)
function drawImageWithoutLogo(canvas, ctx) {
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Get selected phone numbers
    const selected = Array.from(selectedNumbers).map(id => phoneNumbers[id]);
    const maxItems = Math.min(selected.length, 10);
    
    // Calculate spacing
    const itemHeight = 120;
    const totalHeight = maxItems * itemHeight;
    const startY = (canvas.height - totalHeight) / 2;
    
    // Draw phone numbers
    selected.slice(0, maxItems).forEach((data, index) => {
        const y = startY + (index * itemHeight);
        
        // Phone number (black, bold, centered)
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 60px Silom, Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(data.phoneNumber, canvas.width / 2, y);
        
        // Price (gray, smaller, centered below number)
        ctx.fillStyle = '#666666';
        ctx.font = '35px Silom, Monaco, monospace';
        ctx.textAlign = 'center';
        const priceText = `MVR ${data.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        ctx.fillText(priceText, canvas.width / 2, y + 50);
    });
    
    // Display canvas
    const imagePreview = document.getElementById('imagePreview');
    imagePreview.innerHTML = '';
    imagePreview.appendChild(canvas);
    
    // Show download button
    document.getElementById('downloadBtn').style.display = 'block';
}

// Download generated image
function downloadImage() {
    const canvas = document.querySelector('#imagePreview canvas');
    if (!canvas) {
        alert('Please generate an image first');
        return;
    }
    
    // Mark selected numbers as included in image
    const updates = {};
    selectedNumbers.forEach(id => {
        updates[`phoneNumbers/${id}/inImage`] = true;
    });
    window.dbUpdate(window.dbRef(window.db), updates);
    
    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prime-numbers-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// Copy phone number to clipboard
function copyPhoneNumber(event, phoneNumber) {
    event.stopPropagation();
    
    navigator.clipboard.writeText(phoneNumber).then(() => {
        // Visual feedback
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✓';
        btn.style.background = '#4ade80';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 1000);
    }).catch(err => {
        alert('Failed to copy: ' + err);
    });
}