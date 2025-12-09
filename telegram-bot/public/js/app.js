/**
 * KIK Picture Tokens - Mini App
 * Main Application Logic
 */

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
// DATA LOADING
// ============================================

async function loadUserData() {
    try {
        const userId = tg?.initDataUnsafe?.user?.id || 'demo';

        const response = await fetch(`/api/user/${userId}`);
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
            }
        };
        updateUserUI();
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
            showNotification(data.message || window.i18n.t('claim_error', currentLang), 'error');
        }

    } catch (error) {
        console.error('Claim error:', error);
        showNotification(window.i18n.t('claim_error', currentLang), 'error');
    }
}

// ============================================
// UPLOAD PHOTO
// ============================================

function handleUploadPhoto() {
    // Telegram API for photo upload
    if (tg) {
        tg.showPopup({
            title: window.i18n.t('upload_photo', currentLang),
            message: 'Take a photo or choose from gallery',
            buttons: [
                { type: 'default', text: 'Camera' },
                { type: 'default', text: 'Gallery' },
                { type: 'cancel' }
            ]
        });
    } else {
        showNotification('Photo upload available only in Telegram', 'info');
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
        showNotification('Please enter a prompt', 'error');
        return;
    }

    try {
        const userId = tg?.initDataUnsafe?.user?.id || 'demo';

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
            showNotification('Failed to generate image', 'error');
        }

    } catch (error) {
        console.error('AI generation error:', error);
        showNotification('Failed to generate image', 'error');
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
