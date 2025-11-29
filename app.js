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

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderPhoneList(e.target.value);
    });

    // Generate image button
    document.getElementById('generateBtn').addEventListener('click', generateImage);

    // Download button
    document.getElementById('downloadBtn').addEventListener('click', downloadImage);
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

    const bulkText = document.getElementById('bulkNumbers').value.trim();
    const price = parseFloat(document.getElementById('bulkPrice').value);
    const postpaidOnly = document.getElementById('bulkPostpaidOnly').checked;

    if (!bulkText || !price) {
        alert('Please fill in all fields');
        return;
    }

    // Split by newlines and clean each number
    const numbers = bulkText
        .split(/[\n\r]+/)
        .map(line => cleanPhoneNumber(line.trim()))
        .filter(num => num.length > 0);

    if (numbers.length === 0) {
        alert('No valid phone numbers found!');
        return;
    }

    if (numbers.length > 5) {
        alert('Maximum 5 numbers allowed at once!');
        return;
    }

    // Check for duplicates within the batch
    const uniqueNumbers = [...new Set(numbers)];
    if (uniqueNumbers.length !== numbers.length) {
        alert('Duplicate numbers found in your list!');
        return;
    }

    // Check for existing numbers in database
    const existingNumbers = uniqueNumbers.filter(num => 
        Object.values(phoneNumbers).some(data => data.phoneNumber === num)
    );

    if (existingNumbers.length > 0) {
        alert(`These numbers already exist:\n${existingNumbers.join('\n')}`);
        return;
    }

    // Add all numbers
    let addedCount = 0;
    uniqueNumbers.forEach(phoneNumber => {
        window.dbPush(phonesRef, {
            phoneNumber: phoneNumber,
            price: price,
            postpaidOnly: postpaidOnly,
            sold: false,
            createdAt: Date.now()
        });
        addedCount++;
    });

    alert(`Successfully added ${addedCount} phone numbers!`);

    // Clear form
    document.getElementById('bulkForm').reset();
    document.getElementById('bulkNumbers').focus();
}

// Render phone list
function renderPhoneList(searchTerm = '') {
    const phoneList = document.getElementById('phoneList');
    
    // Filter phone numbers
    const filteredNumbers = Object.entries(phoneNumbers).filter(([id, data]) => {
        return data.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (filteredNumbers.length === 0) {
        phoneList.innerHTML = '<div class="empty-state">No phone numbers found</div>';
        return;
    }

    phoneList.innerHTML = filteredNumbers.map(([id, data]) => {
        const isSelected = selectedNumbers.has(id);
        return `
            <div class="phone-item ${isSelected ? 'selected' : ''} ${data.sold ? 'sold' : ''}" onclick="toggleSelection('${id}')">
                <div class="phone-number">${data.phoneNumber}</div>
                <div class="phone-price">MVR ${data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                ${data.postpaidOnly ? '<div class="postpaid-badge">Postpaid Only</div>' : ''}
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
function editPhoneNumber(event, id) {
    event.stopPropagation();
    
    const data = phoneNumbers[id];
    const newPhone = prompt('Edit phone number:', data.phoneNumber);
    
    if (newPhone !== null && newPhone.trim() !== '') {
        const newPrice = prompt('Edit price (MVR):', data.price);
        
        if (newPrice !== null && !isNaN(parseFloat(newPrice))) {
            const postpaidConfirm = confirm('Is this postpaid only?');
            const soldConfirm = confirm('Is this sold?');
            const phoneRef = window.dbRef(window.db, `phoneNumbers/${id}`);
            window.dbUpdate(phoneRef, {
                phoneNumber: newPhone.trim(),
                price: parseFloat(newPrice),
                postpaidOnly: postpaidConfirm,
                sold: soldConfirm
            });
        }
    }
}

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