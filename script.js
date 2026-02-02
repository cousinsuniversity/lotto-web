// Core Wilyonaryo Application Logic

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
});

function initApp() {
    // Initialize user data
    initUserData();
    
    // Initialize ticket creation
    initTicketCreation();
    
    // Initialize modals
    initModals();
    
    // Initialize TV mode button
    initTVMode();
    
    // Load tickets from localStorage
    loadTickets();
}

// User Data Management
function initUserData() {
    // Check if user data exists in localStorage
    if (!localStorage.getItem('wilyonaryo_user')) {
        // Create default user
        const defaultUser = {
            balance: 500.00,
            tickets: [],
            transactionHistory: []
        };
        localStorage.setItem('wilyonaryo_user', JSON.stringify(defaultUser));
    }
    
    // Update UI with user data
    updateUserBalance();
}

function updateUserBalance() {
    const user = JSON.parse(localStorage.getItem('wilyonaryo_user'));
    document.getElementById('userBalance').textContent = user.balance.toFixed(2);
}

// Ticket Creation Logic
function initTicketCreation() {
    const letterInputs = document.querySelectorAll('.letter-input');
    const colorOptions = document.querySelectorAll('.color-option');
    const purchaseBtn = document.getElementById('purchaseTicketBtn');
    
    // Track selected letters and color
    let selectedLetters = ['', '', '', ''];
    let selectedColor = null;
    
    // Set up letter inputs
    letterInputs.forEach((input, index) => {
        // Handle input events
        input.addEventListener('input', function(e) {
            // Convert to uppercase
            let value = e.target.value.toUpperCase();
            
            // Only allow letters A-Z
            if (value && !/^[A-Z]$/.test(value)) {
                value = '';
            }
            
            e.target.value = value;
            selectedLetters[index] = value;
            
            // Move to next input if a letter was entered
            if (value && index < 3) {
                letterInputs[index + 1].focus();
            }
            
            // Update validation and summary
            updateLetterValidation();
            updateTicketSummary();
        });
        
        // Handle paste events
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z]/g, '');
            
            if (pastedText.length > 0) {
                // Fill current and subsequent inputs with pasted letters
                for (let i = 0; i < Math.min(pastedText.length, 4 - index); i++) {
                    const letter = pastedText[i];
                    if (/^[A-Z]$/.test(letter)) {
                        selectedLetters[index + i] = letter;
                        letterInputs[index + i].value = letter;
                    }
                }
                
                // Focus on the next empty input
                const nextEmptyIndex = selectedLetters.findIndex((letter, i) => i >= index && letter === '');
                if (nextEmptyIndex !== -1) {
                    letterInputs[nextEmptyIndex].focus();
                } else if (index + pastedText.length <= 3) {
                    letterInputs[index + pastedText.length].focus();
                }
                
                updateLetterValidation();
                updateTicketSummary();
            }
        });
        
        // Handle keydown events for navigation
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                // Move to previous input on backspace when empty
                letterInputs[index - 1].focus();
            } else if (e.key === 'ArrowLeft' && index > 0) {
                // Move left with arrow key
                letterInputs[index - 1].focus();
            } else if (e.key === 'ArrowRight' && index < 3) {
                // Move right with arrow key
                letterInputs[index + 1].focus();
            }
        });
    });
    
    // Set up color selection
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            selectedColor = this.getAttribute('data-color');
            
            // Update summary
            updateTicketSummary();
        });
    });
    
    // Update letter validation
    function updateLetterValidation() {
        const validationElement = document.getElementById('letterValidation');
        const letters = selectedLetters.filter(letter => letter !== '');
        
        // Check if we have 4 letters
        if (letters.length !== 4) {
            validationElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> Enter 4 unique letters';
            validationElement.style.color = '#FF6B6B';
            purchaseBtn.disabled = true;
            return;
        }
        
        // Check for uniqueness
        const uniqueLetters = new Set(letters);
        if (uniqueLetters.size !== 4) {
            validationElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> Letters must be unique';
            validationElement.style.color = '#FF6B6B';
            purchaseBtn.disabled = true;
            return;
        }
        
        // All validations passed
        validationElement.innerHTML = '<i class="fas fa-check-circle"></i> All letters are unique';
        validationElement.style.color = '#6BCF7F';
        
        // Enable purchase button if color is also selected
        purchaseBtn.disabled = !selectedColor;
    }
    
    // Update ticket summary
    function updateTicketSummary() {
        const letters = selectedLetters.join('').toUpperCase() || '----';
        const color = selectedColor ? selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1) : '---';
        
        document.getElementById('summaryLetters').textContent = letters;
        document.getElementById('summaryColor').textContent = color;
        document.getElementById('selectedColorDisplay').textContent = color;
        
        // Update purchase button state
        const allLettersFilled = selectedLetters.every(letter => letter !== '');
        const lettersUnique = new Set(selectedLetters.filter(letter => letter !== '')).size === 4;
        
        purchaseBtn.disabled = !(allLettersFilled && lettersUnique && selectedColor);
    }
    
    // Handle purchase button click
    purchaseBtn.addEventListener('click', function() {
        // Get user data
        const user = JSON.parse(localStorage.getItem('wilyonaryo_user'));
        
        // Check if user has enough balance
        if (user.balance < 60) {
            alert('Insufficient balance. Please add funds to your wallet.');
            showModal('addFundsModal');
            return;
        }
        
        // Show confirmation modal
        document.getElementById('confirmLetters').textContent = selectedLetters.join('').toUpperCase();
        document.getElementById('confirmColor').textContent = selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1);
        showModal('purchaseModal');
    });
    
    // Initialize with empty validation
    updateLetterValidation();
    updateTicketSummary();
}

// Modal Management
function initModals() {
    // Add Funds Modal
    const addFundsBtn = document.getElementById('addFundsBtn');
    const addFundsModal = document.getElementById('addFundsModal');
    const fundOptions = document.querySelectorAll('.fund-option');
    const addCustomAmountBtn = document.getElementById('addCustomAmount');
    const customAmountInput = document.getElementById('customAmount');
    
    // Show add funds modal
    if (addFundsBtn) {
        addFundsBtn.addEventListener('click', () => showModal('addFundsModal'));
    }
    
    // Fund option buttons
    fundOptions.forEach(option => {
        option.addEventListener('click', function() {
            const amount = parseFloat(this.getAttribute('data-amount'));
            addFunds(amount);
        });
    });
    
    // Custom amount button
    if (addCustomAmountBtn) {
        addCustomAmountBtn.addEventListener('click', function() {
            const amount = parseFloat(customAmountInput.value);
            if (isNaN(amount) || amount < 60) {
                alert('Please enter a valid amount (minimum ₱60).');
                return;
            }
            addFunds(amount);
        });
    }
    
    // Confirm Purchase Modal
    const confirmPurchaseBtn = document.getElementById('confirmPurchaseBtn');
    
    if (confirmPurchaseBtn) {
        confirmPurchaseBtn.addEventListener('click', function() {
            purchaseTicket();
        });
    }
    
    // Close modals when clicking outside or on close buttons
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            modals.forEach(modal => {
                if (modal.style.display === 'flex') {
                    closeModal(modal.id);
                }
            });
        }
    });
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Add funds to wallet
function addFunds(amount) {
    const user = JSON.parse(localStorage.getItem('wilyonaryo_user'));
    user.balance += amount;
    
    // Add transaction to history
    user.transactionHistory.push({
        type: 'deposit',
        amount: amount,
        date: new Date().toISOString(),
        newBalance: user.balance
    });
    
    localStorage.setItem('wilyonaryo_user', JSON.stringify(user));
    updateUserBalance();
    
    // Close modal and show confirmation
    closeModal('addFundsModal');
    
    // Show success message
    showNotification(`Successfully added ₱${amount.toFixed(2)} to your wallet!`, 'success');
}

// Purchase ticket
function purchaseTicket() {
    // Get ticket details
    const letterInputs = document.querySelectorAll('.letter-input');
    const selectedLetters = Array.from(letterInputs).map(input => input.value.toUpperCase());
    const selectedColor = document.querySelector('.color-option.selected').getAttribute('data-color');
    
    // Get user data
    const user = JSON.parse(localStorage.getItem('wilyonaryo_user'));
    
    // Check if user has enough balance (redundant check)
    if (user.balance < 60) {
        alert('Insufficient balance. Please add funds to your wallet.');
        closeModal('purchaseModal');
        showModal('addFundsModal');
        return;
    }
    
    // Deduct ticket price
    user.balance -= 60;
    
    // Create ticket object
    const ticket = {
        id: 'TKT' + Date.now() + Math.floor(Math.random() * 1000),
        letters: selectedLetters,
        color: selectedColor,
        purchaseDate: new Date().toISOString(),
        draws: [
            { time: '10:00', status: 'pending' },
            { time: '15:00', status: 'pending' },
            { time: '20:00', status: 'pending' }
        ],
        status: 'active'
    };
    
    // Add ticket to user's tickets
    user.tickets.push(ticket);
    
    // Add transaction to history
    user.transactionHistory.push({
        type: 'ticket_purchase',
        amount: -60,
        ticketId: ticket.id,
        date: new Date().toISOString(),
        newBalance: user.balance
    });
    
    // Save updated user data
    localStorage.setItem('wilyonaryo_user', JSON.stringify(user));
    
    // Update UI
    updateUserBalance();
    loadTickets();
    
    // Close modal and reset form
    closeModal('purchaseModal');
    resetTicketForm();
    
    // Show success message
    showNotification('Ticket purchased successfully! Good luck!', 'success');
}

// Reset ticket form after purchase
function resetTicketForm() {
    // Clear letter inputs
    const letterInputs = document.querySelectorAll('.letter-input');
    letterInputs.forEach(input => {
        input.value = '';
    });
    
    // Clear color selection
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.classList.remove('selected');
    });
    
    // Reset tracking variables
    if (typeof initTicketCreation !== 'undefined') {
        // Re-initialize ticket creation to reset internal state
        const purchaseBtn = document.getElementById('purchaseTicketBtn');
        purchaseBtn.disabled = true;
        
        // Update summary
        document.getElementById('summaryLetters').textContent = '----';
        document.getElementById('summaryColor').textContent = '---';
        document.getElementById('selectedColorDisplay').textContent = 'None';
        
        // Update validation
        document.getElementById('letterValidation').innerHTML = '<i class="fas fa-exclamation-circle"></i> Enter 4 unique letters';
        document.getElementById('letterValidation').style.color = '#FF6B6B';
    }
}

// Load and display user's tickets
function loadTickets() {
    const user = JSON.parse(localStorage.getItem('wilyonaryo_user'));
    const ticketsContainer = document.getElementById('ticketsContainer');
    
    if (!user.tickets || user.tickets.length === 0) {
        ticketsContainer.innerHTML = `
            <div class="empty-tickets">
                <i class="fas fa-ticket-alt"></i>
                <p>No tickets purchased yet</p>
            </div>
        `;
        return;
    }
    
    // Clear container
    ticketsContainer.innerHTML = '';
    
    // Sort tickets by purchase date (newest first)
    const sortedTickets = user.tickets.sort((a, b) => 
        new Date(b.purchaseDate) - new Date(a.purchaseDate)
    );
    
    // Display tickets
    sortedTickets.forEach(ticket => {
        const ticketElement = document.createElement('div');
        ticketElement.className = 'ticket-card';
        
        // Determine ticket status
        let statusText = 'Active';
        let statusClass = 'status-pending';
        
        // Check if any draw has happened
        const now = new Date();
        const ticketDate = new Date(ticket.purchaseDate);
        const isToday = ticketDate.toDateString() === now.toDateString();
        
        if (!isToday) {
            statusText = 'Expired';
            statusClass = '';
        }
        
        ticketElement.innerHTML = `
            <div class="ticket-info">
                <div class="ticket-letters">${ticket.letters.join(' ')}</div>
                <div class="ticket-color" style="background-color: ${getColorHex(ticket.color)}"></div>
                <div>Ticket #${ticket.id.substring(3, 8)}</div>
            </div>
            <div class="ticket-status ${statusClass}">${statusText}</div>
        `;
        
        ticketsContainer.appendChild(ticketElement);
    });
}

// Helper function to get color hex code
function getColorHex(colorName) {
    const colorMap = {
        'red': '#FF6B6B',
        'blue': '#4D96FF',
        'green': '#6BCF7F',
        'yellow': '#FFD166',
        'purple': '#9D65C9',
        'orange': '#FF8C42',
        'pink': '#FF9FDE',
        'teal': '#2EC4B6',
        'brown': '#A86464',
        'gray': '#8A8A8A',
        'black': '#2D2D2D',
        'cyan': '#00C1D4'
    };
    
    return colorMap[colorName] || '#DDD';
}

// TV Mode functionality
function initTVMode() {
    const tvModeBtn = document.getElementById('tvModeBtn');
    
    if (tvModeBtn) {
        tvModeBtn.addEventListener('click', function() {
            window.open('tv.html', '_blank', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
        });
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Set icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#6BCF7F' : type === 'error' ? '#FF6B6B' : '#4D96FF'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    // Add keyframes for animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
