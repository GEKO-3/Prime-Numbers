// Global variables
let generatedNumbers = {};
let mirrorRef;

// Initialize generator
window.initGenerator = function() {
    if (!window.db || !window.dbRef) {
        setTimeout(window.initGenerator, 100);
        return;
    }
    
    mirrorRef = window.dbRef(window.db, 'mirrorNumbers');
    
    // Load existing generated numbers
    window.dbOnValue(mirrorRef, (snapshot) => {
        generatedNumbers = snapshot.val() || {};
        updateHistory();
    });
    
    // Generate button click
    document.getElementById('generateBtn').addEventListener('click', generateMirrorNumber);
}

// Generate mirror number
async function generateMirrorNumber() {
    const btn = document.getElementById('generateBtn');
    btn.disabled = true;
    btn.textContent = 'Generating...';
    
    try {
        let mirrorNumber = '';
        let attempts = 0;
        const maxAttempts = 100;
        
        // Keep generating until we find a unique number
        while (attempts < maxAttempts) {
            // Generate 3 random digits
            const firstDigit = Math.floor(Math.random() * 10);
            const secondDigit = Math.floor(Math.random() * 10);
            const thirdDigit = Math.floor(Math.random() * 10);
            
            // Create mirror number (e.g., 345 -> 345543)
            const threeDigits = `${firstDigit}${secondDigit}${thirdDigit}`;
            const reversed = `${thirdDigit}${secondDigit}${firstDigit}`;
            mirrorNumber = threeDigits + reversed;
            
            // Check if number already exists
            const exists = Object.values(generatedNumbers).some(
                data => data.mirrorNumber === mirrorNumber
            );
            
            if (!exists) {
                break; // Found unique number
            }
            
            attempts++;
        }
        
        if (attempts >= maxAttempts) {
            showError('Failed to generate unique number. Please try again.');
            btn.disabled = false;
            btn.textContent = 'Generate Number';
            return;
        }
        
        // Save to database
        window.dbPush(mirrorRef, {
            mirrorNumber: mirrorNumber,
            createdAt: Date.now()
        });
        
        // Copy to clipboard with permission request
        try {
            // Request clipboard permission if needed
            if (navigator.permissions && navigator.permissions.query) {
                const permissionStatus = await navigator.permissions.query({ name: 'clipboard-write' });
                if (permissionStatus.state === 'denied') {
                    throw new Error('Clipboard permission denied');
                }
            }
            
            // Copy to clipboard
            await navigator.clipboard.writeText(mirrorNumber);
            
            // Display result
            document.getElementById('generatedNumber').textContent = mirrorNumber;
            document.getElementById('statusMessage').textContent = '✓ Copied to clipboard!';
            document.getElementById('statusMessage').className = 'status-message';
            document.getElementById('resultDisplay').style.display = 'flex';
        } catch (clipboardError) {
            // Use fallback method
            const success = copyToClipboardFallback(mirrorNumber);
            
            document.getElementById('generatedNumber').textContent = mirrorNumber;
            if (success) {
                document.getElementById('statusMessage').textContent = '✓ Copied to clipboard!';
            } else {
                document.getElementById('statusMessage').textContent = '✓ Number generated (Select & copy)';
            }
            document.getElementById('statusMessage').className = 'status-message';
            document.getElementById('resultDisplay').style.display = 'flex';
        }
        
        // Reset display after 3 seconds
        setTimeout(() => {
            document.getElementById('resultDisplay').style.display = 'none';
            document.getElementById('resultDisplay').onclick = null;
        }, 3000);
        
    } catch (error) {
        showError('Error generating number: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Generate Number';
    }
}

// Fallback copy method
function copyToClipboardFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    let success = false;
    try {
        success = document.execCommand('copy');
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }
    
    document.body.removeChild(textarea);
    return success;
}

// Show error message
function showError(message) {
    document.getElementById('generatedNumber').textContent = '⚠';
    document.getElementById('statusMessage').textContent = message;
    document.getElementById('statusMessage').className = 'status-message error-message';
    document.getElementById('resultDisplay').style.display = 'flex';
    
    setTimeout(() => {
        document.getElementById('resultDisplay').style.display = 'none';
    }, 4000);
}

// Update history display
function updateHistory() {
    const historyList = document.getElementById('historyList');
    
    const numbers = Object.values(generatedNumbers);
    
    if (numbers.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: #999;">No numbers generated yet</p>';
        return;
    }
    
    // Sort by creation time, newest first
    numbers.sort((a, b) => b.createdAt - a.createdAt);
    
    historyList.innerHTML = numbers.map(data => {
        const date = new Date(data.createdAt);
        const timeString = date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="history-item">
                <div class="history-number">${data.mirrorNumber}</div>
                <div class="history-time">${timeString}</div>
            </div>
        `;
    }).join('');
}
