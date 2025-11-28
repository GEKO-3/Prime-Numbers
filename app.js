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

    // Form submission
    document.getElementById('phoneForm').addEventListener('submit', addPhoneNumber);

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderPhoneList(e.target.value);
    });

    // Generate image button
    document.getElementById('generateBtn').addEventListener('click', generateImage);

    // Download button
    document.getElementById('downloadBtn').addEventListener('click', downloadImage);
}

// Add phone number
function addPhoneNumber(e) {
    e.preventDefault();

    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    const postpaidOnly = document.getElementById('postpaidOnly').checked;
    const sold = document.getElementById('soldStatus').checked;

    if (!phoneNumber || !price) {
        alert('Please fill in all fields');
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
    phoneList.innerHTML = filteredNumbers.map(([id, data]) => {
        const isSelected = selectedNumbers.has(id);
        return `
            <div class="phone-item ${isSelected ? 'selected' : ''} ${data.sold ? 'sold' : ''}" onclick="toggleSelection('${id}')">
                <div class="phone-number">${data.phoneNumber}</div>
                <div class="phone-price">MVR ${data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                ${data.postpaidOnly ? '<div class="postpaid-badge">Postpaid Only</div>' : ''}
                ${data.sold ? '<div class="sold-badge">SOLD</div>' : ''}
                <div class="phone-actions">
                    <button class="btn-edit" onclick="editPhoneNumber(event, '${id}')">Edit</button>
                    <button class="btn-delete" onclick="deletePhoneNumber(event, '${id}')">Delete</button>
                    ${!data.sold ? `<button class="btn-sold" onclick="markAsSold(event, '${id}')">Mark Sold</button>` : ''}
                </div>
            </div>
        `;
    }).join('');v>
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
    
    if (confirm('Mark this number as sold?')) {
        const phoneRef = window.dbRef(window.db, `phoneNumbers/${id}`);
        window.dbUpdate(phoneRef, {
            sold: true
        });
    }
}       }
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

// Generate image (5:3 ratio)
function generateImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size (5:3 ratio) - 2000x1200 for high quality
    canvas.width = 2000;
    canvas.height = 1200;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Load and draw logo
    const logoImg = new Image();
    logoImg.src = 'prime numbers profile.svg';
    
    logoImg.onload = () => {
        // Draw logo at top center
        const logoSize = 120;
        ctx.drawImage(logoImg, (canvas.width - logoSize) / 2, 50, logoSize, logoSize);
        
        // Title
        ctx.fillStyle = 'white';
        ctx.font = 'bold 70px Silom, Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Prime Numbers', canvas.width / 2, 230);
        
        // Get selected phone numbers
        const selected = Array.from(selectedNumbers).map(id => phoneNumbers[id]);
        
        // Draw phone numbers
        const startY = 320;
        const lineHeight = 80;
        const maxItems = Math.min(selected.length, 10);
        
        ctx.font = 'bold 45px Silom, Monaco, monospace';
        
        selected.slice(0, maxItems).forEach((data, index) => {
            const y = startY + (index * lineHeight);
            
            // Draw semi-transparent background box
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(100, y - 50, canvas.width - 200, 70);
            
            // Phone number (left aligned)
            ctx.fillStyle = 'white';
            ctx.textAlign = 'left';
            ctx.fillText(data.phoneNumber, 150, y);
            
            // Price (right aligned)
            ctx.textAlign = 'right';
            const priceText = `MVR ${data.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            ctx.fillText(priceText, canvas.width - 150, y);
        });
        
        // Footer
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '30px Silom, Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Contact us for premium numbers', canvas.width / 2, canvas.height - 50);
        
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
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px Silom, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Prime Numbers', canvas.width / 2, 150);
    
    // Get selected phone numbers
    const selected = Array.from(selectedNumbers).map(id => phoneNumbers[id]);
    
    // Draw phone numbers
    const startY = 280;
    const lineHeight = 80;
    const maxItems = Math.min(selected.length, 10);
    
    ctx.font = 'bold 45px Silom, Monaco, monospace';
    
    selected.slice(0, maxItems).forEach((data, index) => {
        const y = startY + (index * lineHeight);
        
        // Draw semi-transparent background box
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(100, y - 50, canvas.width - 200, 70);
        
        // Phone number (left aligned)
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText(data.phoneNumber, 150, y);
        
        // Price (right aligned)
        ctx.textAlign = 'right';
        const priceText = `MVR ${data.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        ctx.fillText(priceText, canvas.width - 150, y);
    });
    
    // Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '30px Silom, Monaco, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Contact us for premium numbers', canvas.width / 2, canvas.height - 50);
    
    // Display canvas
    const imagePreview = document.getElementById('imagePreview');
    imagePreview.innerHTML = '';
    imagePreview.appendChild(canvas);
    
    // Show download button
    document.getElementById('downloadBtn').style.display = 'block';
}

// Download image
function downloadImage() {
    const canvas = document.querySelector('#imagePreview canvas');
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `prime-numbers-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}
