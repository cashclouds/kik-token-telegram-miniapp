/**
 * KIK Picture Tokens - Mini App
 * Main Application Logic
 */

// Debug logging
console.log('🚀 App.js loaded successfully');
console.log('Telegram WebApp available:', !!window.Telegram?.WebApp);

// Global error handler
window.onerror = function(msg, url, line, col, error) {
    console.error('❌ Global Error:', {
        message: msg,
        url: url,
        line: line,
        column: col,
        error: error
    });
    alert(`Error: ${msg}\nLine: ${line}`);
    return false;
};

// Promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Unhandled Promise Rejection:', event.reason);
    alert(`Promise Error: ${event.reason}`);
});

// Global state
let tg = window.Telegram?.WebApp;
let currentUser = null;
let currentLang = 'en';

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Telegram WebApp
    if (tg) {
        tg.ready();
        tg.expand();

        // Set theme colors
        const theme = tg.colorScheme === 'dark' ? 'dark-theme' : '';
        document.body.className = theme;

        // Enable main button
        tg.MainButton.setText('Loading...');
        tg.MainButton.show();
    }

    // Initialize i18n
    currentLang = window.i18n.init();
    window.i18n.translate(currentLang);

    // Load user data
    await loadUserData();

    // Setup event listeners
    setupEventListeners();

    // FIX: Initialize sticky header
    initStickyHeader();

    // Hide loading, show app
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    // Update Telegram main button
    if (tg) {
        tg.MainButton.setText(window.i18n.t('claim_now', currentLang));
        tg.MainButton.onClick(handleDailyClaim);
    }
});

// ============================================
// STICKY HEADER FIX
// ============================================

function initStickyHeader() {
    const tabs = document.querySelector('.tabs');
    const header = document.querySelector('.header');

    if (!tabs || !header) return;

    // Calculate header height
    const headerHeight = header.offsetHeight;

    // Set sticky position
    tabs.style.top = `${headerHeight}px`;

    // Add scroll event listener for smooth transitions
    window.addEventListener('scroll', () => {
        if (window.scrollY > headerHeight) {
            tabs.classList.add('sticky');
        } else {
            tabs.classList.remove('sticky');
        }
    });

    // Add placeholder to prevent content jump
    const placeholder = document.createElement('div');
    placeholder.className = 'tabs-sticky-placeholder';
    placeholder.style.height = `${tabs.offsetHeight}px`;
    tabs.parentNode.insertBefore(placeholder, tabs);

    // Update on resize
    window.addEventListener('resize', () => {
        const newHeaderHeight = header.offsetHeight;
        tabs.style.top = `${newHeaderHeight}px`;
        placeholder.style.height = `${tabs.offsetHeight}px`;
    });
}

// ============================================
// DATA LOADING
// ============================================

async function loadUserData() {
    try {
        const userId = tg?.initDataUnsafe?.user?.id || 'demo';

        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`/api/user/${userId}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Failed to load user data');

        const data = await response.json();
        currentUser = data;

        // Update UI
        updateUserUI();
        updateStatsUI();
        updateCollectionUI();
        updateInviteUI();
        updateProfileUI();

    } catch (error) {
        console.error('Error loading user data:', error);
        // Use demo data for testing
        currentUser = {
            id: 'demo',
            username: 'Demo User',
            level: 1,
            experience: 0,
            tokens: {
                total: 3,
                attached: 0,
                unattached: 3
            },
            referrals: {
                total: 0,
                active: 0,
                earned: 0
            },
            pictures: [],
            referralCode: 'DEMO123'
        };
        
        // Update all UI sections with demo data
        updateUserUI();
        updateStatsUI();
        updateCollectionUI();
        updateInviteUI();
        updateProfileUI();
    }
}

// ============================================
// UI UPDATES
// ============================================

function updateUserUI() {
    if (!currentUser) return;

    document.getElementById('userLevel').textContent = currentUser.level || 1;
    document.getElementById('tokenCount').textContent = currentUser.tokens?.total || 0;
}

function updateStatsUI() {
    if (!currentUser) return;

    document.getElementById('totalTokens').textContent = currentUser.tokens?.total || 0;
    document.getElementById('attachedTokens').textContent = currentUser.tokens?.attached || 0;
    document.getElementById('unattachedCount').textContent = currentUser.tokens?.unattached || 0;
    document.getElementById('userXP').textContent = currentUser.experience || 0;
    document.getElementById('referralCount').textContent = currentUser.referrals?.total || 0;
}

function updateCollectionUI() {
    const grid = document.getElementById('collectionGrid');
    const empty = document.getElementById('emptyCollection');

    if (!currentUser || !currentUser.pictures || currentUser.pictures.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';

    grid.innerHTML = '';
    currentUser.pictures.forEach(picture => {
        const card = createPictureCard(picture);
        grid.appendChild(card);
    });
}

function updateInviteUI() {
    if (!currentUser) return;

    document.getElementById('totalInvited').textContent = currentUser.referrals?.total || 0;
    document.getElementById('activeToday').textContent = currentUser.referrals?.active || 0;
    document.getElementById('earnedTokens').textContent = currentUser.referrals?.earned || 0;

    // Referral link
    const botUsername = tg?.initDataUnsafe?.bot?.username || 'kikpicturebot';
    const referralCode = currentUser.referralCode || 'DEMO123';
    const link = `https://t.me/${botUsername}?start=${referralCode}`;
    document.getElementById('referralLink').value = link;
}

function updateProfileUI() {
    if (!currentUser) return;

    const username = currentUser.username || 'User';
    const initial = username.charAt(0).toUpperCase();

    document.getElementById('profileInitial').textContent = initial;
    document.getElementById('profileUsername').textContent = username;
    document.getElementById('profileLevel').textContent = currentUser.level || 1;
    document.getElementById('currentLevel').textContent = currentUser.level || 1;
    document.getElementById('currentXP').textContent = currentUser.experience || 0;

    // Calculate next level XP
    const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000];
    const currentLevel = currentUser.level || 1;
    const nextLevelXP = thresholds[currentLevel] || 16000;
    document.getElementById('nextLevelXP').textContent = nextLevelXP;

    // Progress bar
    const progress = ((currentUser.experience || 0) / nextLevelXP) * 100;
    document.getElementById('xpProgress').style.width = `${Math.min(progress, 100)}%`;
}

// ============================================
// PICTURE CARD
// ============================================

function createPictureCard(picture) {
    const card = document.createElement('div');
    card.className = 'picture-card';

    const img = document.createElement('img');
    img.className = 'picture-image';
    img.src = picture.imageUrl;
    img.alt = picture.isPrivate ? '🔒 Private' : '🌍 Public';

    const info = document.createElement('div');
    info.className = 'picture-info';

    const privacy = document.createElement('div');
    privacy.className = 'picture-privacy';
    privacy.textContent = picture.isPrivate ? '🔒 Private' : '🌍 Public';

    info.appendChild(privacy);
    card.appendChild(img);
    card.appendChild(info);

    return card;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => handleTabChange(tab.dataset.tab));
    });

    // Daily claim
    document.getElementById('claimBtn')?.addEventListener('click', handleDailyClaim);

    // Upload photo
    document.getElementById('uploadPhotoBtn')?.addEventListener('click', handleUploadPhoto);

    // Generate AI
    document.getElementById('generateAIBtn')?.addEventListener('click', handleGenerateAI);

    // Copy link
    document.getElementById('copyLinkBtn')?.addEventListener('click', handleCopyLink);

    // Share link
    document.getElementById('shareBtn')?.addEventListener('click', handleShareLink);

    // Language change
    document.getElementById('languageSelect')?.addEventListener('change', handleLanguageChange);

    // AI Modal
    document.getElementById('closeAIModal')?.addEventListener('click', closeAIModal);
    document.getElementById('cancelAIBtn')?.addEventListener('click', closeAIModal);
    document.getElementById('generateNowBtn')?.addEventListener('click', handleAIGenerate);

    // Upload Modal
    document.getElementById('closeUploadModal')?.addEventListener('click', closeUploadModal);
    document.getElementById('cancelUploadBtn')?.addEventListener('click', closeUploadModal);
    document.getElementById('cameraBtn')?.addEventListener('click', handleCameraUpload);
    document.getElementById('galleryBtn')?.addEventListener('click', handleGalleryUpload);
    document.getElementById('confirmUploadBtn')?.addEventListener('click', handleConfirmUpload);
    document.getElementById('privateBtn')?.addEventListener('click', () => setPrivacy('private'));
    document.getElementById('publicBtn')?.addEventListener('click', () => setPrivacy('public'));

    // Example tags
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const example = tag.dataset.example;
            document.getElementById('aiPrompt').value = example;
        });
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => handleFilterChange(btn.dataset.filter));
    });

    // File input handlers
    document.getElementById('cameraInput')?.addEventListener('change', handleFileSelected);
    document.getElementById('galleryInput')?.addEventListener('change', handleFileSelected);
}

// ============================================
// FILE INPUT HANDLER
// ============================================

async function handleFileSelected(event) {
    try {
        const file = event.target.files[0];
        
        if (!file) {
            console.log('No file selected');
            return;
        }

        console.log('File selected:', file.name, file.type, file.size);

        // Check if it's an image
        if (!file.type.startsWith('image/')) {
            showNotification('Please select an image file', 'error');
            return;
        }

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            showNotification('Image too large. Max size: 10MB', 'error');
            return;
        }

        // Read file as Data URL
        const reader = new FileReader();
        
        reader.onload = function(e) {
            console.log('File loaded, showing preview');
            showUploadPreview(e.target.result);
        };

        reader.onerror = function(error) {
            console.error('Error reading file:', error);
            showNotification('Failed to read image file', 'error');
        };

        reader.readAsDataURL(file);

    } catch (error) {
        console.error('File selection error:', error);
        showNotification('Failed to process image', 'error');
    }
}

// ============================================
// TAB NAVIGATION
// ============================================

function handleTabChange(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// ============================================
// DAILY CLAIM
// ============================================

async function handleDailyClaim() {
    try {
        const userId = tg?.initDataUnsafe?.user?.id || 'demo';

        const response = await fetch('/api/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(window.i18n.t('claim_success', currentLang), 'success');
            await loadUserData(); // Reload user data
        } else {
            // Translate error messages from backend
            let errorMsg = window.i18n.t('claim_error', currentLang);
            
            // Check for specific error reasons
            if (data.message) {
                if (data.message.includes('already claimed')) {
                    errorMsg = window.i18n.t('claim_already', currentLang);
                } else if (data.message.includes('attach') || data.message.includes('pictures')) {
                    errorMsg = window.i18n.t('claim_not_available', currentLang);
                }
            }
            
            showNotification(errorMsg, 'error');
        }

    } catch (error) {
        console.error('Claim error:', error);
        showNotification(window.i18n.t('claim_error', currentLang), 'error');
    }
}

// ============================================
// UPLOAD PHOTO - NEW IMPLEMENTATION
// ============================================

async function handleUploadPhoto() {
    try {
        const userId = tg?.initDataUnsafe?.user?.id || 'demo';

        // Check if user has unattached tokens
        if (!currentUser || currentUser.tokens.unattached === 0) {
            showNotification(window.i18n.t('claim_not_available', currentLang), 'error');
            return;
        }

        // Show upload modal
        document.getElementById('uploadModal').classList.add('active');

    } catch (error) {
        console.error('Upload photo error:', error);
        showNotification(window.i18n.t('claim_error', currentLang), 'error');
    }
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('previewImage').src = '';
}

async function handleCameraUpload() {
    try {
        console.log('Camera button clicked');
        const cameraInput = document.getElementById('cameraInput');
        
        if (!cameraInput) {
            console.error('Camera input not found');
            showNotification('Camera input not available', 'error');
            return;
        }

        // Trigger file input for camera
        cameraInput.click();

    } catch (error) {
        console.error('Camera access error:', error);
        showNotification('Failed to access camera', 'error');
    }
}

async function handleGalleryUpload() {
    try {
        console.log('Gallery button clicked');
        const galleryInput = document.getElementById('galleryInput');
        
        if (!galleryInput) {
            console.error('Gallery input not found');
            showNotification('Gallery input not available', 'error');
            return;
        }

        // Trigger file input for gallery
        galleryInput.click();

    } catch (error) {
        console.error('Gallery access error:', error);
        showNotification('Failed to access gallery', 'error');
    }
}

function showUploadPreview(photoData) {
    const preview = document.getElementById('uploadPreview');
    const previewImage = document.getElementById('previewImage');

    // Set preview image
    previewImage.src = photoData;
    preview.style.display = 'block';

    // Store photo data for upload
    window.currentPhotoData = photoData;
}

function setPrivacy(privacy) {
    // Update privacy buttons
    document.getElementById('privateBtn').classList.remove('active');
    document.getElementById('publicBtn').classList.remove('active');
    document.getElementById(`${privacy}Btn`).classList.add('active');

    // Store privacy setting
    window.currentPhotoPrivacy = privacy;
}

async function handleConfirmUpload() {
    try {
        if (!window.currentPhotoData) {
            showNotification('No photo selected', 'error');
            return;
        }

        if (!window.currentPhotoPrivacy) {
            showNotification('Please select privacy setting', 'error');
            return;
        }

        const userId = tg?.initDataUnsafe?.user?.id || 'demo';

        // Show loading
        showNotification('Uploading photo...', 'info');

        // Upload photo to server
        const response = await fetch('/api/upload-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                photoData: window.currentPhotoData,
                isPrivate: window.currentPhotoPrivacy === 'private'
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Photo uploaded successfully!', 'success');
            closeUploadModal();
            await loadUserData(); // Reload user data
        } else {
            showNotification(data.message || 'Failed to upload photo', 'error');
        }

    } catch (error) {
        console.error('Upload error:', error);
        showNotification('Failed to upload photo', 'error');
    }
}

// ============================================
// GENERATE AI
// ============================================

function handleGenerateAI() {
    document.getElementById('aiModal').classList.add('active');
}

function closeAIModal() {
    document.getElementById('aiModal').classList.remove('active');
    document.getElementById('aiPrompt').value = '';
}

async function handleAIGenerate() {
    const prompt = document.getElementById('aiPrompt').value.trim();

    if (!prompt) {
        showNotification(window.i18n.t('ai_prompt_hint', currentLang), 'error');
        return;
    }

    try {
        const userId = tg?.initDataUnsafe?.user?.id || 'demo';

        // Show loading
        showNotification('Generating...', 'info');

        const response = await fetch('/api/generate-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, prompt })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(window.i18n.t('ai_generated', currentLang), 'success');
            closeAIModal();
            await loadUserData(); // Reload to show new picture
        } else {
            showNotification(window.i18n.t('claim_error', currentLang), 'error');
        }

    } catch (error) {
        console.error('AI generation error:', error);
        showNotification(window.i18n.t('claim_error', currentLang), 'error');
    }
}

// ============================================
// COPY & SHARE LINK
// ============================================

function handleCopyLink() {
    const link = document.getElementById('referralLink').value;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(() => {
            showNotification(window.i18n.t('link_copied', currentLang), 'success');
        });
    } else {
        // Fallback
        const input = document.getElementById('referralLink');
        input.select();
        document.execCommand('copy');
        showNotification(window.i18n.t('link_copied', currentLang), 'success');
    }
}

function handleShareLink() {
    const link = document.getElementById('referralLink').value;
    const text = 'Join KIK Picture Tokens and earn rewards!';

    if (tg) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
    } else if (navigator.share) {
        navigator.share({ title: 'KIK Picture Tokens', text, url: link });
    }
}

// ============================================
// LANGUAGE CHANGE
// ============================================

function handleLanguageChange(event) {
    const newLang = event.target.value;
    currentLang = newLang;
    window.i18n.translate(newLang);
}

// ============================================
// FILTER COLLECTION
// ============================================

function handleFilterChange(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Filter pictures (implement based on your data structure)
    console.log('Filter:', filter);
}

// ============================================
// NOTIFICATIONS
// ============================================

function showNotification(message, type = 'info') {
    if (tg) {
        tg.showAlert(message);
    } else {
        alert(message);
    }
}

// ============================================
// COUNTDOWN TIMER
// ============================================

function startCountdown() {
    const countdownEl = document.getElementById('dailyCountdown');
    if (!countdownEl) return;

    setInterval(() => {
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setHours(24, 0, 0, 0);

        const diff = tomorrow - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Start countdown
startCountdown();
