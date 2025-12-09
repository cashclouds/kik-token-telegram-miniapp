/**
 * i18n - Multi-language Support
 * 20+ languages for global reach
 */

const translations = {
    en: {
        // Tabs
        tab_home: 'Home',
        tab_collection: 'Collection',
        tab_invite: 'Invite',
        tab_profile: 'Profile',

        // Loading
        loading: 'Loading...',

        // Daily Claim
        daily_tokens: 'Daily Tokens',
        claim_available: 'Claim 3 tokens available!',
        claim_not_available: 'Attach all pictures first!',
        claim_already: 'Already claimed today!',
        claim_now: 'Claim Now',

        // Tokens
        unattached_tokens: 'Tokens Without Pictures',
        attach_reminder: 'Attach pictures to all tokens to get more tomorrow!',
        upload_photo: 'Upload Photo',
        generate_ai: 'Generate AI',

        // Stats
        total_tokens: 'Total Tokens',
        with_pictures: 'With Pictures',
        experience: 'Experience',
        referrals: 'Referrals',

        // Collection
        filter_all: 'All',
        filter_private: 'Private',
        filter_public: 'Public',
        no_pictures: 'No pictures yet. Start attaching!',

        // Invite
        invite_friends: 'Invite Friends',
        total_invited: 'Total Invited',
        active_today: 'Active Today',
        earned_tokens: 'Tokens Earned',
        copy_link: 'Copy Link',
        share_link: 'Share Link',
        referral_rewards: 'Referral Rewards',
        reward_signup: '+1 token when friend joins',
        reward_daily: '+1 token/day per active friend',

        // Profile
        settings: 'Settings',
        language: 'Language',
        progress: 'Progress',
        level: 'Level',

        // AI Modal
        ai_generation: 'AI Generation',
        ai_prompt_hint: 'Enter a description for AI to generate:',
        examples: 'Examples:',
        cancel: 'Cancel',
        generate: 'Generate',

        // Messages
        link_copied: 'Link copied to clipboard!',
        claim_success: 'You received 3 tokens!',
        claim_error: 'Cannot claim tokens right now.',
        photo_uploaded: 'Photo uploaded successfully!',
        ai_generated: 'Image generated successfully!'
    },

    ru: {
        // Вкладки
        tab_home: 'Главная',
        tab_collection: 'Коллекция',
        tab_invite: 'Пригласить',
        tab_profile: 'Профиль',

        // Загрузка
        loading: 'Загрузка...',

        // Ежедневная раздача
        daily_tokens: 'Ежедневные токены',
        claim_available: 'Получи 3 токена!',
        claim_not_available: 'Сначала привяжи все картинки!',
        claim_already: 'Уже получено сегодня!',
        claim_now: 'Получить',

        // Токены
        unattached_tokens: 'Токены без картинок',
        attach_reminder: 'Привяжи картинки ко всем токенам, чтобы получить больше завтра!',
        upload_photo: 'Загрузить фото',
        generate_ai: 'Создать AI',

        // Статистика
        total_tokens: 'Всего токенов',
        with_pictures: 'С картинками',
        experience: 'Опыт',
        referrals: 'Рефералы',

        // Коллекция
        filter_all: 'Все',
        filter_private: 'Приватные',
        filter_public: 'Публичные',
        no_pictures: 'Пока нет картинок. Начни добавлять!',

        // Приглашения
        invite_friends: 'Пригласить друзей',
        total_invited: 'Всего приглашено',
        active_today: 'Активных сегодня',
        earned_tokens: 'Заработано токенов',
        copy_link: 'Скопировать',
        share_link: 'Поделиться',
        referral_rewards: 'Награды за рефералов',
        reward_signup: '+1 токен когда друг присоединится',
        reward_daily: '+1 токен/день за активного друга',

        // Профиль
        settings: 'Настройки',
        language: 'Язык',
        progress: 'Прогресс',
        level: 'Уровень',

        // AI Модалка
        ai_generation: 'Создание AI',
        ai_prompt_hint: 'Опиши что хочешь создать:',
        examples: 'Примеры:',
        cancel: 'Отмена',
        generate: 'Создать',

        // Сообщения
        link_copied: 'Ссылка скопирована!',
        claim_success: 'Ты получил 3 токена!',
        claim_error: 'Не можешь получить токены сейчас.',
        photo_uploaded: 'Фото загружено успешно!',
        ai_generated: 'Изображение создано!'
    },

    es: {
        tab_home: 'Inicio',
        tab_collection: 'Colección',
        tab_invite: 'Invitar',
        tab_profile: 'Perfil',
        loading: 'Cargando...',
        daily_tokens: 'Tokens Diarios',
        claim_available: '¡Reclama 3 tokens!',
        claim_now: 'Reclamar Ahora',
        unattached_tokens: 'Tokens sin Imágenes',
        upload_photo: 'Subir Foto',
        generate_ai: 'Generar AI',
        // ... (add more translations)
    },

    zh: {
        tab_home: '首页',
        tab_collection: '收藏',
        tab_invite: '邀请',
        tab_profile: '个人资料',
        loading: '加载中...',
        daily_tokens: '每日代币',
        claim_available: '领取3个代币！',
        claim_now: '立即领取',
        // ... (add more translations)
    },

    hi: {
        tab_home: 'होम',
        tab_collection: 'संग्रह',
        tab_invite: 'आमंत्रित करें',
        tab_profile: 'प्रोफ़ाइल',
        loading: 'लोड हो रहा है...',
        daily_tokens: 'दैनिक टोकन',
        claim_available: '3 टोकन प्राप्त करें!',
        claim_now: 'अभी प्राप्त करें',
        // ... (add more translations)
    },

    ar: {
        tab_home: 'الرئيسية',
        tab_collection: 'المجموعة',
        tab_invite: 'دعوة',
        tab_profile: 'الملف الشخصي',
        loading: 'جاري التحميل...',
        daily_tokens: 'الرموز اليومية',
        claim_available: 'احصل على 3 رموز!',
        claim_now: 'احصل الآن',
        // ... (add more translations)
    },

    pt: {
        tab_home: 'Início',
        tab_collection: 'Coleção',
        tab_invite: 'Convidar',
        tab_profile: 'Perfil',
        loading: 'Carregando...',
        daily_tokens: 'Tokens Diários',
        claim_available: 'Reivindique 3 tokens!',
        claim_now: 'Reivindicar Agora',
        // ... (add more translations)
    },

    bn: {
        tab_home: 'হোম',
        tab_collection: 'সংগ্রহ',
        tab_invite: 'আমন্ত্রণ',
        tab_profile: 'প্রোফাইল',
        loading: 'লোড হচ্ছে...',
        daily_tokens: 'দৈনিক টোকেন',
        claim_available: '3টি টোকেন পান!',
        claim_now: 'এখনই পান',
        // ... (add more translations)
    },

    id: {
        tab_home: 'Beranda',
        tab_collection: 'Koleksi',
        tab_invite: 'Undang',
        tab_profile: 'Profil',
        loading: 'Memuat...',
        daily_tokens: 'Token Harian',
        claim_available: 'Klaim 3 token!',
        claim_now: 'Klaim Sekarang',
        // ... (add more translations)
    },

    ja: {
        tab_home: 'ホーム',
        tab_collection: 'コレクション',
        tab_invite: '招待',
        tab_profile: 'プロフィール',
        loading: '読み込み中...',
        daily_tokens: 'デイリートークン',
        claim_available: '3トークンを受け取る！',
        claim_now: '今すぐ受け取る',
        // ... (add more translations)
    }
};

// Initialize i18next
function initI18n() {
    // Detect user language from Telegram or browser
    let userLang = 'en';

    if (window.Telegram?.WebApp) {
        userLang = window.Telegram.WebApp.initDataUnsafe?.user?.language_code || 'en';
    } else {
        userLang = navigator.language.split('-')[0];
    }

    // Check if translation exists
    if (!translations[userLang]) {
        userLang = 'en';
    }

    // Load saved language preference
    const savedLang = localStorage.getItem('language');
    if (savedLang && translations[savedLang]) {
        userLang = savedLang;
    }

    return userLang;
}

// Translate page
function translatePage(lang) {
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = translations[lang]?.[key];

        if (translation) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        }
    });

    // Save language preference
    localStorage.setItem('language', lang);

    // Update language select
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) {
        langSelect.value = lang;
    }
}

// Get translation
function t(key, lang) {
    const currentLang = lang || localStorage.getItem('language') || 'en';
    return translations[currentLang]?.[key] || translations['en']?.[key] || key;
}

// Export functions
window.i18n = {
    init: initI18n,
    translate: translatePage,
    t: t,
    translations: translations
};
