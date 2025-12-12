/**
 * i18n - Multi-language Support
 * 28 European languages for global reach
 * Integrated with Telegram bot i18n system
 */

// Import translations from bot system
const translations = {
    en: {
        "welcome": {
            "title": "🎮 Welcome to KIK Picture Tokens, {{username}}!",
            "received_tokens": "🎁 You've received {{count}} KIK tokens!",
            "how_it_works": "🎨 **How it works:**",
            "step1": "• Each token needs a picture (upload or AI generate)",
            "step2": "• Attach pictures to ALL your tokens to get 3 more tomorrow",
            "step3": "• Invite friends and earn bonus tokens daily",
            "step4": "• Collect, trade, and level up!",
            "first_task": "**Your First Task:**",
            "first_task_desc": "Attach pictures to your {{count}} tokens to get more tomorrow! 👇",
            "referral_joined": "✅ You joined using a referral link! Your friend got a bonus token."
        },
        "about": {
            "title": "🌟 **What is KIK Picture Tokens?**",
            "description": "KIK Picture Tokens is a unique blockchain-based game where your creativity becomes valuable digital assets!",
            "what_you_get": "**🎁 What you get:**",
            "benefit1": "• 3 FREE tokens every day (worth real money!)",
            "benefit2": "• Turn your photos into NFTs on blockchain",
            "benefit3": "• Generate AI artwork with just text prompts",
            "benefit4": "• Earn passive income by inviting friends",
            "benefit5": "• Trade tokens on global marketplace",
            "why_cool": "**🚀 Why it's AWESOME:**",
            "cool1": "✨ **Easy to use** - No crypto knowledge needed",
            "cool2": "💰 **Free to start** - Get tokens just for joining",
            "cool3": "🎨 **Creative freedom** - Your art, your rules",
            "cool4": "🔒 **Privacy options** - Keep photos private or share publicly",
            "cool5": "🌍 **Global community** - Connect with creators worldwide",
            "cool6": "📈 **Growing value** - Early adopters benefit most",
            "how_help": "**💡 How it helps YOU:**",
            "help1": "📸 **Preserve memories** - Store photos on blockchain forever",
            "help2": "💵 **Earn money** - Turn creativity into income",
            "help3": "🎮 **Have fun** - Gamified experience with levels & rewards",
            "help4": "👥 **Build network** - Grow your referral tree passively",
            "help5": "🏆 **Compete** - Climb leaderboards, win prizes",
            "tokenomics": "**💎 Tokenomics:**",
            "total_supply": "Total supply: 10,000,000,000 KIK tokens",
            "distribution": "Fair distribution - everyone starts equal!",
            "cta": "🎯 **Ready to start?**\nPress /start and get your first 3 tokens NOW!"
        },
        "daily": {
            "title": "⏳ **Daily Tokens**",
            "claimed": "✅ **Daily Tokens Claimed!**",
            "received": "🎁 You received {{count}} tokens",
            "bonus": "🌟 BONUS: +{{count}} tokens from active referrals!",
            "remember": "📊 **Remember:**\nAttach pictures to ALL tokens to get more tomorrow!",
            "not_eligible": "You need to attach pictures to ALL yesterday's tokens first!",
            "already_claimed": "You already claimed your daily tokens today. Come back tomorrow!",
            "new_user": "Welcome! Use /start to begin.",
            "timer_info": "⏳ Next tokens available in {{hours}} hours (at {{time}})",
            "referral_timers_title": "**👥 Referral Bonus Timers:**",
            "referral_timer": "⏳ Friend bonus available in {{hours}} hours (at {{time}})"
        },
        "attach": {
            "title": "🎨 **Attach Pictures**",
            "count": "You have {{count}} tokens without pictures.",
            "choose": "Choose how to add a picture:",
            "all_attached": "✅ All your tokens have pictures!\n\nClaim more tokens tomorrow with /daily",
            "upload_photo": "📸 **Upload Photo**\n\nSend me a photo to attach to your token:",
            "generate_ai": "🤖 **AI Generation**\n\nSend me a text prompt to generate an image:\n\nExample: \"red ferrari\", \"sunset beach\", \"cute cat\"",
            "privacy_title": "🔒 **Privacy Settings**\n\nMake this picture:",
            "privacy_private": "🔒 Private (only you see)",
            "privacy_public": "🌍 Public (everyone sees)",
            "success": "✅ Picture attached successfully! +10 XP",
            "failed": "❌ Failed to attach picture: {{message}}",
            "upload_failed": "❌ Failed to upload photo. Try again.",
            "generating": "🎨 Generating image... Please wait.",
            "generate_failed": "❌ Failed to generate image. Try again."
        },
        "collection": {
            "title": "📸 **Your Collection**",
            "total_tokens": "🎁 Total Tokens: {{count}}",
            "with_pictures": "✅ With Pictures: {{count}}",
            "without_pictures": "⏳ Without Pictures: {{count}}",
            "private_pictures": "🔒 Private Pictures: {{count}}",
            "public_pictures": "🌍 Public Pictures: {{count}}",
            "level": "👤 Level: {{level}}",
            "experience": "⭐ Experience: {{xp}} XP",
            "empty": "📭 Your collection is empty. Attach pictures to your tokens!",
            "token_info": "🎨 **Token #{{current}}/{{total}}**\n\n{{privacy}}\nCreated: {{date}}\n\nUse /collection to see stats"
        },
        "invite": {
            "title": "👥 **Invite Friends**",
            "your_link": "Your referral link:",
            "rewards_title": "🎁 **Rewards:**",
            "reward1": "• +1 token when friend joins",
            "reward2": "• +1 token/day per active friend",
            "stats_title": "📊 **Your Stats:**",
            "referrals": "• Referrals: {{count}}",
            "total_earned": "• Total Earned: {{count}} tokens",
            "share": "📤 Share Link",
            "referral_timers_title": "**👥 Referral Bonus Timers:**",
            "referral_timer": "⏳ Friend bonus available in {{hours}} hours (at {{time}})"
        },
        "help": {
            "title": "ℹ️ **KIK Picture Tokens - Help**",
            "commands": "**Main Commands:**",
            "cmd_start": "/start - Get started and receive tokens",
            "cmd_daily": "/daily - Claim your daily 3 tokens",
            "cmd_attach": "/attach - Attach pictures to tokens",
            "cmd_collection": "/collection - View your collection",
            "cmd_invite": "/invite - Invite friends for rewards",
            "cmd_language": "/language - Change language",
            "cmd_about": "/about - Learn about KIK tokens",
            "cmd_help": "/help - Show this help",
            "how_title": "**How it works:**",
            "how1": "1. Get 3 tokens per day",
            "how2": "2. Attach pictures to ALL tokens",
            "how3": "3. If you complete yesterday's tokens → get 3 more today",
            "how4": "4. Invite friends for bonus tokens",
            "tips_title": "**Tips:**",
            "tip1": "• Pictures can be uploaded or AI-generated",
            "tip2": "• Make pictures private or public",
            "tip3": "• Level up by being active",
            "tip4": "• Invite friends for passive income"
        },
        "language": {
            "title": "🌍 **Choose Your Language**",
            "current": "Current language: {{language}}",
            "changed": "✅ Language changed to {{language}}!"
        },
        "buttons": {
            "attach_picture": "🎨 Attach Picture",
            "collection": "📸 Collection",
            "daily_claim": "🎁 Daily Claim",
            "invite": "👥 Invite",
            "help": "ℹ️ Help",
            "about": "🌟 About",
            "language": "🌍 Language",
            "back": "« Back",
            "back_to_menu": "« Back to Menu",
            "attach_more": "🎨 Attach More",
            "view_all": "👀 View All",
            "upload_photo": "📸 Upload Photo",
            "generate_ai": "🤖 Generate AI",
            "regenerate": "🔄 Regenerate",
            "share_link": "📤 Share Link"
        },
        "errors": {
            "general": "❌ Something went wrong. Please try again.",
            "no_pending_image": "⚠️ No pending image"
        },
        "terms": {
            "title": "📜 **Terms of Use**",
            "intro": "By using KIK Picture Tokens, you agree to:",
            "term1": "**1. Fair Use**\n• No spam or abuse\n• No multiple accounts\n• No automated bots",
            "term2": "**2. Content Policy**\n• No illegal content\n• No hate speech or violence\n• Respect copyright laws",
            "term3": "**3. Privacy**\n• Private photos are encrypted\n• Public photos are visible to all\n• We don't share your data",
            "term4": "**4. Rewards**\n• Tokens have real value\n• Fair distribution system\n• Rewards are non-refundable",
            "term5": "**5. Changes**\n• We may update terms\n• Major changes notified in advance\n• Continued use = acceptance"
        },
        "tabs": {
            "tab_home": "Home",
            "tab_collection": "Collection",
            "tab_invite": "Invite",
            "tab_profile": "Profile"
        },
        "upload": {
            "take_photo": "Take Photo",
            "choose_gallery": "Choose from Gallery",
            "preview": "Preview",
            "privacy_settings": "Privacy Settings",
            "private": "Private",
            "public": "Public",
            "confirm": "Confirm"
        },
        "loading": "Loading...",
        "claim_success": "Tokens claimed successfully!",
        "claim_error": "Failed to claim tokens",
        "claim_already": "Already claimed today",
        "claim_not_available": "Not available yet",
        "ai_generation": "AI Generation",
        "ai_prompt_hint": "Enter a description for AI to generate",
        "examples": "Examples",
        "cancel": "Cancel",
        "generate": "Generate",
        "link_copied": "Link copied to clipboard!",
        "filter_all": "All",
        "filter_private": "Private",
        "filter_public": "Public",
        "no_pictures": "No pictures yet. Start attaching!"
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
        // Pestañas
        tab_home: 'Inicio',
        tab_collection: 'Colección',
        tab_invite: 'Invitar',
        tab_profile: 'Perfil',

        // Carga
        loading: 'Cargando...',

        // Reclamación Diaria
        daily_tokens: 'Tokens Diarios',
        claim_available: '¡Reclama 3 tokens!',
        claim_not_available: '¡Adjunta todas las imágenes primero!',
        claim_already: '¡Ya reclamado hoy!',
        claim_now: 'Reclamar Ahora',

        // Tokens
        unattached_tokens: 'Tokens sin Imágenes',
        attach_reminder: '¡Adjunta imágenes a todos los tokens para obtener más mañana!',
        upload_photo: 'Subir Foto',
        generate_ai: 'Generar IA',

        // Estadísticas
        total_tokens: 'Tokens Totales',
        with_pictures: 'Con Imágenes',
        experience: 'Experiencia',
        referrals: 'Referencias',

        // Colección
        filter_all: 'Todos',
        filter_private: 'Privados',
        filter_public: 'Públicos',
        no_pictures: 'Aún no hay imágenes. ¡Empieza a adjuntar!',

        // Invitaciones
        invite_friends: 'Invitar Amigos',
        total_invited: 'Total Invitados',
        active_today: 'Activos Hoy',
        earned_tokens: 'Tokens Ganados',
        copy_link: 'Copiar Enlace',
        share_link: 'Compartir Enlace',
        referral_rewards: 'Recompensas por Referencias',
        reward_signup: '+1 token cuando un amigo se une',
        reward_daily: '+1 token/día por amigo activo',

        // Perfil
        settings: 'Configuración',
        language: 'Idioma',
        progress: 'Progreso',
        level: 'Nivel',

        // Modal IA
        ai_generation: 'Generación IA',
        ai_prompt_hint: 'Describe lo que quieres generar:',
        examples: 'Ejemplos:',
        cancel: 'Cancelar',
        generate: 'Generar',

        // Mensajes
        link_copied: '¡Enlace copiado al portapapeles!',
        claim_success: '¡Recibiste 3 tokens!',
        claim_error: 'No se pueden reclamar tokens ahora.',
        photo_uploaded: '¡Foto subida exitosamente!',
        ai_generated: '¡Imagen generada exitosamente!'
    },

    zh: {
        // 标签页
        tab_home: '首页',
        tab_collection: '收藏',
        tab_invite: '邀请',
        tab_profile: '个人资料',

        // 加载
        loading: '加载中...',

        // 每日领取
        daily_tokens: '每日代币',
        claim_available: '领取3个代币！',
        claim_not_available: '请先附加所有图片！',
        claim_already: '今天已领取！',
        claim_now: '立即领取',

        // 代币
        unattached_tokens: '没有图片的代币',
        attach_reminder: '为所有代币附加图片以便明天获得更多！',
        upload_photo: '上传照片',
        generate_ai: '生成AI',

        // 统计
        total_tokens: '总代币',
        with_pictures: '有图片',
        experience: '经验',
        referrals: '推荐',

        // 收藏
        filter_all: '全部',
        filter_private: '私密',
        filter_public: '公开',
        no_pictures: '还没有图片。开始添加吧！',

        // 邀请
        invite_friends: '邀请好友',
        total_invited: '邀请总数',
        active_today: '今日活跃',
        earned_tokens: '获得的代币',
        copy_link: '复制链接',
        share_link: '分享链接',
        referral_rewards: '推荐奖励',
        reward_signup: '好友加入时+1代币',
        reward_daily: '每个活跃好友每天+1代币',

        // 个人资料
        settings: '设置',
        language: '语言',
        progress: '进度',
        level: '等级',

        // AI模态框
        ai_generation: 'AI生成',
        ai_prompt_hint: '输入描述以便AI生成：',
        examples: '示例：',
        cancel: '取消',
        generate: '生成',

        // 消息
        link_copied: '链接已复制到剪贴板！',
        claim_success: '你收到了3个代币！',
        claim_error: '现在无法领取代币。',
        photo_uploaded: '照片上传成功！',
        ai_generated: '图像生成成功！'
    },

    hi: {
        // टैब
        tab_home: 'होम',
        tab_collection: 'संग्रह',
        tab_invite: 'आमंत्रित करें',
        tab_profile: 'प्रोफ़ाइल',

        // लोडिंग
        loading: 'लोड हो रहा है...',

        // दैनिक दावा
        daily_tokens: 'दैनिक टोकन',
        claim_available: '3 टोकन प्राप्त करें!',
        claim_not_available: 'पहले सभी चित्र संलग्न करें!',
        claim_already: 'आज पहले ही प्राप्त कर लिया!',
        claim_now: 'अभी प्राप्त करें',

        // टोकन
        unattached_tokens: 'चित्रों के बिना टोकन',
        attach_reminder: 'कल अधिक पाने के लिए सभी टोकन में चित्र संलग्न करें!',
        upload_photo: 'फोटो अपलोड करें',
        generate_ai: 'AI जनरेट करें',

        // आंकड़े
        total_tokens: 'कुल टोकन',
        with_pictures: 'चित्रों के साथ',
        experience: 'अनुभव',
        referrals: 'रेफरल',

        // संग्रह
        filter_all: 'सभी',
        filter_private: 'निजी',
        filter_public: 'सार्वजनिक',
        no_pictures: 'अभी तक कोई चित्र नहीं। जोड़ना शुरू करें!',

        // आमंत्रण
        invite_friends: 'मित्रों को आमंत्रित करें',
        total_invited: 'कुल आमंत्रित',
        active_today: 'आज सक्रिय',
        earned_tokens: 'अर्जित टोकन',
        copy_link: 'लिंक कॉपी करें',
        share_link: 'लिंक शेयर करें',
        referral_rewards: 'रेफरल पुरस्कार',
        reward_signup: 'मित्र के शामिल होने पर +1 टोकन',
        reward_daily: 'सक्रिय मित्र के लिए +1 टोकन/दिन',

        // प्रोफाइल
        settings: 'सेटिंग्स',
        language: 'भाषा',
        progress: 'प्रगति',
        level: 'स्तर',

        // AI मोडल
        ai_generation: 'AI जनरेशन',
        ai_prompt_hint: 'AI के लिए विवरण दर्ज करें:',
        examples: 'उदाहरण:',
        cancel: 'रद्द करें',
        generate: 'जनरेट करें',

        // संदेश
        link_copied: 'लिंक क्लिपबोर्ड में कॉपी हो गया!',
        claim_success: 'आपको 3 टोकन मिले!',
        claim_error: 'अभी टोकन प्राप्त नहीं कर सकते।',
        photo_uploaded: 'फोटो सफलतापूर्वक अपलोड हुआ!',
        ai_generated: 'छवि सफलतापूर्वक जनरेट हुई!'
    },

    ar: {
        // علامات التبويب
        tab_home: 'الرئيسية',
        tab_collection: 'المجموعة',
        tab_invite: 'دعوة',
        tab_profile: 'الملف الشخصي',

        // التحميل
        loading: 'جاري التحميل...',

        // المطالبة اليومية
        daily_tokens: 'الرموز اليومية',
        claim_available: 'احصل على 3 رموز!',
        claim_not_available: 'أرفق جميع الصور أولاً!',
        claim_already: 'تم الحصول عليها اليوم!',
        claim_now: 'احصل الآن',

        // الرموز
        unattached_tokens: 'رموز بدون صور',
        attach_reminder: 'أرفق صورًا لجميع الرموز للحصول على المزيد غدًا!',
        upload_photo: 'تحميل صورة',
        generate_ai: 'إنشاء بالذكاء الاصطناعي',

        // الإحصائيات
        total_tokens: 'إجمالي الرموز',
        with_pictures: 'مع الصور',
        experience: 'الخبرة',
        referrals: 'الإحالات',

        // المجموعة
        filter_all: 'الكل',
        filter_private: 'خاص',
        filter_public: 'عام',
        no_pictures: 'لا توجد صور حتى الآن. ابدأ الإرفاق!',

        // الدعوة
        invite_friends: 'دعوة الأصدقاء',
        total_invited: 'إجمالي المدعوين',
        active_today: 'نشط اليوم',
        earned_tokens: 'الرموز المكتسبة',
        copy_link: 'نسخ الرابط',
        share_link: 'مشاركة الرابط',
        referral_rewards: 'مكافآت الإحالة',
        reward_signup: '+1 رمز عند انضمام صديق',
        reward_daily: '+1 رمز/يوم لكل صديق نشط',

        // الملف الشخصي
        settings: 'الإعدادات',
        language: 'اللغة',
        progress: 'التقدم',
        level: 'المستوى',

        // نافذة الذكاء الاصطناعي
        ai_generation: 'إنشاء بالذكاء الاصطناعي',
        ai_prompt_hint: 'أدخل وصفًا للإنشاء بالذكاء الاصطناعي:',
        examples: 'أمثلة:',
        cancel: 'إلغاء',
        generate: 'إنشاء',

        // الرسائل
        link_copied: 'تم نسخ الرابط إلى الحافظة!',
        claim_success: 'لقد حصلت على 3 رموز!',
        claim_error: 'لا يمكن المطالبة بالرموز الآن.',
        photo_uploaded: 'تم تحميل الصورة بنجاح!',
        ai_generated: 'تم إنشاء الصورة بنجاح!'
    },

    pt: {
        // Abas
        tab_home: 'Início',
        tab_collection: 'Coleção',
        tab_invite: 'Convidar',
        tab_profile: 'Perfil',

        // Carregamento
        loading: 'Carregando...',

        // Reivindicação Diária
        daily_tokens: 'Tokens Diários',
        claim_available: 'Reivindique 3 tokens!',
        claim_not_available: 'Anexe todas as imagens primeiro!',
        claim_already: 'Já reivindicado hoje!',
        claim_now: 'Reivindicar Agora',

        // Tokens
        unattached_tokens: 'Tokens Sem Imagens',
        attach_reminder: 'Anexe imagens a todos os tokens para obter mais amanhã!',
        upload_photo: 'Enviar Foto',
        generate_ai: 'Gerar IA',

        // Estatísticas
        total_tokens: 'Total de Tokens',
        with_pictures: 'Com Imagens',
        experience: 'Experiência',
        referrals: 'Referências',

        // Coleção
        filter_all: 'Todos',
        filter_private: 'Privados',
        filter_public: 'Públicos',
        no_pictures: 'Ainda não há imagens. Comece a anexar!',

        // Convite
        invite_friends: 'Convidar Amigos',
        total_invited: 'Total Convidados',
        active_today: 'Ativos Hoje',
        earned_tokens: 'Tokens Ganhos',
        copy_link: 'Copiar Link',
        share_link: 'Compartilhar Link',
        referral_rewards: 'Recompensas de Referência',
        reward_signup: '+1 token quando um amigo se junta',
        reward_daily: '+1 token/dia por amigo ativo',

        // Perfil
        settings: 'Configurações',
        language: 'Idioma',
        progress: 'Progresso',
        level: 'Nível',

        // Modal IA
        ai_generation: 'Geração IA',
        ai_prompt_hint: 'Digite uma descrição para a IA gerar:',
        examples: 'Exemplos:',
        cancel: 'Cancelar',
        generate: 'Gerar',

        // Mensagens
        link_copied: 'Link copiado para a área de transferência!',
        claim_success: 'Você recebeu 3 tokens!',
        claim_error: 'Não é possível reivindicar tokens agora.',
        photo_uploaded: 'Foto enviada com sucesso!',
        ai_generated: 'Imagem gerada com sucesso!'
    },

    bn: {
        // ট্যাব
        tab_home: 'হোম',
        tab_collection: 'সংগ্রহ',
        tab_invite: 'আমন্ত্রণ',
        tab_profile: 'প্রোফাইল',

        // লোডিং
        loading: 'লোড হচ্ছে...',

        // দৈনিক দাবি
        daily_tokens: 'দৈনিক টোকেন',
        claim_available: '3টি টোকেন পান!',
        claim_not_available: 'প্রথমে সব ছবি সংযুক্ত করুন!',
        claim_already: 'আজ ইতিমধ্যে পেয়েছেন!',
        claim_now: 'এখনই পান',

        // টোকেন
        unattached_tokens: 'ছবি ছাড়া টোকেন',
        attach_reminder: 'আগামীকাল আরও পেতে সব টোকেনে ছবি সংযুক্ত করুন!',
        upload_photo: 'ছবি আপলোড করুন',
        generate_ai: 'AI তৈরি করুন',

        // পরিসংখ্যান
        total_tokens: 'মোট টোকেন',
        with_pictures: 'ছবি সহ',
        experience: 'অভিজ্ঞতা',
        referrals: 'রেফারেল',

        // সংগ্রহ
        filter_all: 'সব',
        filter_private: 'ব্যক্তিগত',
        filter_public: 'পাবলিক',
        no_pictures: 'এখনও কোনো ছবি নেই। যোগ করা শুরু করুন!',

        // আমন্ত্রণ
        invite_friends: 'বন্ধুদের আমন্ত্রণ করুন',
        total_invited: 'মোট আমন্ত্রিত',
        active_today: 'আজ সক্রিয়',
        earned_tokens: 'অর্জিত টোকেন',
        copy_link: 'লিঙ্ক কপি করুন',
        share_link: 'লিঙ্ক শেয়ার করুন',
        referral_rewards: 'রেফারেল পুরস্কার',
        reward_signup: 'বন্ধু যোগদান করলে +1 টোকেন',
        reward_daily: 'সক্রিয় বন্ধুর জন্য +1 টোকেন/দিন',

        // প্রোফাইল
        settings: 'সেটিংস',
        language: 'ভাষা',
        progress: 'অগ্রগতি',
        level: 'স্তর',

        // AI মডেল
        ai_generation: 'AI তৈরি',
        ai_prompt_hint: 'AI এর জন্য বিবরণ লিখুন:',
        examples: 'উদাহরণ:',
        cancel: 'বাতিল',
        generate: 'তৈরি করুন',

        // বার্তা
        link_copied: 'লিঙ্ক ক্লিপবোর্ডে কপি হয়েছে!',
        claim_success: 'আপনি 3টি টোকেন পেয়েছেন!',
        claim_error: 'এখন টোকেন পাওয়া যাবে না।',
        photo_uploaded: 'ছবি সফলভাবে আপলোড হয়েছে!',
        ai_generated: 'ছবি সফলভাবে তৈরি হয়েছে!'
    },

    id: {
        // Tab
        tab_home: 'Beranda',
        tab_collection: 'Koleksi',
        tab_invite: 'Undang',
        tab_profile: 'Profil',

        // Memuat
        loading: 'Memuat...',

        // Klaim Harian
        daily_tokens: 'Token Harian',
        claim_available: 'Klaim 3 token!',
        claim_not_available: 'Lampirkan semua gambar terlebih dahulu!',
        claim_already: 'Sudah diklaim hari ini!',
        claim_now: 'Klaim Sekarang',

        // Token
        unattached_tokens: 'Token Tanpa Gambar',
        attach_reminder: 'Lampirkan gambar ke semua token untuk mendapatkan lebih banyak besok!',
        upload_photo: 'Unggah Foto',
        generate_ai: 'Buat AI',

        // Statistik
        total_tokens: 'Total Token',
        with_pictures: 'Dengan Gambar',
        experience: 'Pengalaman',
        referrals: 'Referensi',

        // Koleksi
        filter_all: 'Semua',
        filter_private: 'Pribadi',
        filter_public: 'Publik',
        no_pictures: 'Belum ada gambar. Mulai melampirkan!',

        // Undangan
        invite_friends: 'Undang Teman',
        total_invited: 'Total Diundang',
        active_today: 'Aktif Hari Ini',
        earned_tokens: 'Token yang Diperoleh',
        copy_link: 'Salin Tautan',
        share_link: 'Bagikan Tautan',
        referral_rewards: 'Hadiah Referensi',
        reward_signup: '+1 token saat teman bergabung',
        reward_daily: '+1 token/hari per teman aktif',

        // Profil
        settings: 'Pengaturan',
        language: 'Bahasa',
        progress: 'Kemajuan',
        level: 'Level',

        // Modal AI
        ai_generation: 'Pembuatan AI',
        ai_prompt_hint: 'Masukkan deskripsi untuk AI buat:',
        examples: 'Contoh:',
        cancel: 'Batal',
        generate: 'Buat',

        // Pesan
        link_copied: 'Tautan disalin ke clipboard!',
        claim_success: 'Anda menerima 3 token!',
        claim_error: 'Tidak dapat mengklaim token sekarang.',
        photo_uploaded: 'Foto berhasil diunggah!',
        ai_generated: 'Gambar berhasil dibuat!'
    },

    ja: {
        // タブ
        tab_home: 'ホーム',
        tab_collection: 'コレクション',
        tab_invite: '招待',
        tab_profile: 'プロフィール',

        // 読み込み
        loading: '読み込み中...',

        // 毎日の請求
        daily_tokens: 'デイリートークン',
        claim_available: '3トークンを受け取る！',
        claim_not_available: '最初にすべての画像を添付してください！',
        claim_already: '今日はすでに受け取りました！',
        claim_now: '今すぐ受け取る',

        // トークン
        unattached_tokens: '画像のないトークン',
        attach_reminder: '明日さらに受け取るには、すべてのトークンに画像を添付してください！',
        upload_photo: '写真をアップロード',
        generate_ai: 'AI生成',

        // 統計
        total_tokens: '合計トークン',
        with_pictures: '画像付き',
        experience: '経験値',
        referrals: '紹介',

        // コレクション
        filter_all: 'すべて',
        filter_private: 'プライベート',
        filter_public: '公開',
        no_pictures: 'まだ画像がありません。添付を始めましょう！',

        // 招待
        invite_friends: '友達を招待',
        total_invited: '招待総数',
        active_today: '今日のアクティブ',
        earned_tokens: '獲得したトークン',
        copy_link: 'リンクをコピー',
        share_link: 'リンクを共有',
        referral_rewards: '紹介報酬',
        reward_signup: '友達が参加すると+1トークン',
        reward_daily: 'アクティブな友達1人につき+1トークン/日',

        // プロフィール
        settings: '設定',
        language: '言語',
        progress: '進捗',
        level: 'レベル',

        // AIモーダル
        ai_generation: 'AI生成',
        ai_prompt_hint: 'AIが生成する説明を入力：',
        examples: '例：',
        cancel: 'キャンセル',
        generate: '生成',

        // メッセージ
        link_copied: 'リンクをクリップボードにコピーしました！',
        claim_success: '3トークンを受け取りました！',
        claim_error: '今はトークンを受け取れません。',
        photo_uploaded: '写真が正常にアップロードされました！',
        ai_generated: '画像が正常に生成されました！'
    },

    fr: {
        // Onglets
        tab_home: 'Accueil',
        tab_collection: 'Collection',
        tab_invite: 'Inviter',
        tab_profile: 'Profil',

        // Chargement
        loading: 'Chargement...',

        // Réclamation quotidienne
        daily_tokens: 'Tokens Quotidiens',
        claim_available: 'Réclamez 3 tokens !',
        claim_not_available: 'Attachez d\'abord toutes les images !',
        claim_already: 'Déjà réclamé aujourd\'hui !',
        claim_now: 'Réclamer Maintenant',

        // Tokens
        unattached_tokens: 'Tokens Sans Images',
        attach_reminder: 'Attachez des images à tous les tokens pour en obtenir plus demain !',
        upload_photo: 'Télécharger Photo',
        generate_ai: 'Générer IA',

        // Statistiques
        total_tokens: 'Total Tokens',
        with_pictures: 'Avec Images',
        experience: 'Expérience',
        referrals: 'Parrainages',

        // Collection
        filter_all: 'Tous',
        filter_private: 'Privés',
        filter_public: 'Publics',
        no_pictures: 'Pas encore d\'images. Commencez à attacher !',

        // Invitation
        invite_friends: 'Inviter des Amis',
        total_invited: 'Total Invités',
        active_today: 'Actifs Aujourd\'hui',
        earned_tokens: 'Tokens Gagnés',
        copy_link: 'Copier Lien',
        share_link: 'Partager Lien',
        referral_rewards: 'Récompenses de Parrainage',
        reward_signup: '+1 token quand un ami rejoint',
        reward_daily: '+1 token/jour par ami actif',

        // Profil
        settings: 'Paramètres',
        language: 'Langue',
        progress: 'Progrès',
        level: 'Niveau',

        // Modal IA
        ai_generation: 'Génération IA',
        ai_prompt_hint: 'Entrez une description pour l\'IA :',
        examples: 'Exemples :',
        cancel: 'Annuler',
        generate: 'Générer',

        // Messages
        link_copied: 'Lien copié dans le presse-papiers !',
        claim_success: 'Vous avez reçu 3 tokens !',
        claim_error: 'Impossible de réclamer des tokens maintenant.',
        photo_uploaded: 'Photo téléchargée avec succès !',
        ai_generated: 'Image générée avec succès !'
    },

    de: {
        // Tabs
        tab_home: 'Startseite',
        tab_collection: 'Sammlung',
        tab_invite: 'Einladen',
        tab_profile: 'Profil',

        // Laden
        loading: 'Wird geladen...',

        // Täglicher Anspruch
        daily_tokens: 'Tägliche Token',
        claim_available: 'Hol dir 3 Token!',
        claim_not_available: 'Füge zuerst alle Bilder hinzu!',
        claim_already: 'Heute bereits eingelöst!',
        claim_now: 'Jetzt Einlösen',

        // Token
        unattached_tokens: 'Token Ohne Bilder',
        attach_reminder: 'Füge allen Token Bilder hinzu, um morgen mehr zu erhalten!',
        upload_photo: 'Foto Hochladen',
        generate_ai: 'KI Generieren',

        // Statistiken
        total_tokens: 'Gesamt Token',
        with_pictures: 'Mit Bildern',
        experience: 'Erfahrung',
        referrals: 'Empfehlungen',

        // Sammlung
        filter_all: 'Alle',
        filter_private: 'Privat',
        filter_public: 'Öffentlich',
        no_pictures: 'Noch keine Bilder. Fang an hinzuzufügen!',

        // Einladung
        invite_friends: 'Freunde Einladen',
        total_invited: 'Gesamt Eingeladen',
        active_today: 'Heute Aktiv',
        earned_tokens: 'Verdiente Token',
        copy_link: 'Link Kopieren',
        share_link: 'Link Teilen',
        referral_rewards: 'Empfehlungsbelohnungen',
        reward_signup: '+1 Token wenn ein Freund beitritt',
        reward_daily: '+1 Token/Tag pro aktivem Freund',

        // Profil
        settings: 'Einstellungen',
        language: 'Sprache',
        progress: 'Fortschritt',
        level: 'Level',

        // KI Modal
        ai_generation: 'KI-Generierung',
        ai_prompt_hint: 'Gib eine Beschreibung für die KI ein:',
        examples: 'Beispiele:',
        cancel: 'Abbrechen',
        generate: 'Generieren',

        // Nachrichten
        link_copied: 'Link in die Zwischenablage kopiert!',
        claim_success: 'Du hast 3 Token erhalten!',
        claim_error: 'Token können jetzt nicht eingelöst werden.',
        photo_uploaded: 'Foto erfolgreich hochgeladen!',
        ai_generated: 'Bild erfolgreich generiert!'
    },

    it: {
        // Schede
        tab_home: 'Home',
        tab_collection: 'Collezione',
        tab_invite: 'Invita',
        tab_profile: 'Profilo',

        // Caricamento
        loading: 'Caricamento...',

        // Richiesta giornaliera
        daily_tokens: 'Token Giornalieri',
        claim_available: 'Richiedi 3 token!',
        claim_not_available: 'Allega prima tutte le immagini!',
        claim_already: 'Già richiesto oggi!',
        claim_now: 'Richiedi Ora',

        // Token
        unattached_tokens: 'Token Senza Immagini',
        attach_reminder: 'Allega immagini a tutti i token per ottenerne di più domani!',
        upload_photo: 'Carica Foto',
        generate_ai: 'Genera IA',

        // Statistiche
        total_tokens: 'Token Totali',
        with_pictures: 'Con Immagini',
        experience: 'Esperienza',
        referrals: 'Referral',

        // Collezione
        filter_all: 'Tutti',
        filter_private: 'Privati',
        filter_public: 'Pubblici',
        no_pictures: 'Nessuna immagine ancora. Inizia ad allegare!',

        // Invito
        invite_friends: 'Invita Amici',
        total_invited: 'Totale Invitati',
        active_today: 'Attivi Oggi',
        earned_tokens: 'Token Guadagnati',
        copy_link: 'Copia Link',
        share_link: 'Condividi Link',
        referral_rewards: 'Ricompense Referral',
        reward_signup: '+1 token quando un amico si unisce',
        reward_daily: '+1 token/giorno per amico attivo',

        // Profilo
        settings: 'Impostazioni',
        language: 'Lingua',
        progress: 'Progresso',
        level: 'Livello',

        // Modal IA
        ai_generation: 'Generazione IA',
        ai_prompt_hint: 'Inserisci una descrizione per l\'IA:',
        examples: 'Esempi:',
        cancel: 'Annulla',
        generate: 'Genera',

        // Messaggi
        link_copied: 'Link copiato negli appunti!',
        claim_success: 'Hai ricevuto 3 token!',
        claim_error: 'Impossibile richiedere token ora.',
        photo_uploaded: 'Foto caricata con successo!',
        ai_generated: 'Immagine generata con successo!'
    },

    pl: {
        // Zakładki
        tab_home: 'Główna',
        tab_collection: 'Kolekcja',
        tab_invite: 'Zaproś',
        tab_profile: 'Profil',

        // Ładowanie
        loading: 'Ładowanie...',

        // Dzienny odbiór
        daily_tokens: 'Dzienne Tokeny',
        claim_available: 'Odbierz 3 tokeny!',
        claim_not_available: 'Najpierw dołącz wszystkie zdjęcia!',
        claim_already: 'Już odebrane dzisiaj!',
        claim_now: 'Odbierz Teraz',

        // Tokeny
        unattached_tokens: 'Tokeny Bez Zdjęć',
        attach_reminder: 'Dołącz zdjęcia do wszystkich tokenów, aby jutro otrzymać więcej!',
        upload_photo: 'Prześlij Zdjęcie',
        generate_ai: 'Generuj AI',

        // Statystyki
        total_tokens: 'Wszystkie Tokeny',
        with_pictures: 'Ze Zdjęciami',
        experience: 'Doświadczenie',
        referrals: 'Polecenia',

        // Kolekcja
        filter_all: 'Wszystkie',
        filter_private: 'Prywatne',
        filter_public: 'Publiczne',
        no_pictures: 'Jeszcze brak zdjęć. Zacznij dodawać!',

        // Zaproszenia
        invite_friends: 'Zaproś Znajomych',
        total_invited: 'Zaproszonych Ogółem',
        active_today: 'Aktywni Dzisiaj',
        earned_tokens: 'Zdobyte Tokeny',
        copy_link: 'Kopiuj Link',
        share_link: 'Udostępnij Link',
        referral_rewards: 'Nagrody za Polecenia',
        reward_signup: '+1 token gdy znajomy dołączy',
        reward_daily: '+1 token/dzień za aktywnego znajomego',

        // Profil
        settings: 'Ustawienia',
        language: 'Język',
        progress: 'Postęp',
        level: 'Poziom',

        // Modal AI
        ai_generation: 'Generowanie AI',
        ai_prompt_hint: 'Wprowadź opis dla AI:',
        examples: 'Przykłady:',
        cancel: 'Anuluj',
        generate: 'Generuj',

        // Wiadomości
        link_copied: 'Link skopiowany do schowka!',
        claim_success: 'Otrzymałeś 3 tokeny!',
        claim_error: 'Nie można teraz odebrać tokenów.',
        photo_uploaded: 'Zdjęcie przesłane pomyślnie!',
        ai_generated: 'Obraz wygenerowany pomyślnie!'
    },

    uk: {
        // Вкладки
        tab_home: 'Головна',
        tab_collection: 'Колекція',
        tab_invite: 'Запросити',
        tab_profile: 'Профіль',

        // Завантаження
        loading: 'Завантаження...',

        // Щоденна роздача
        daily_tokens: 'Щоденні токени',
        claim_available: 'Отримай 3 токени!',
        claim_not_available: 'Спочатку прикріпи всі картинки!',
        claim_already: 'Вже отримано сьогодні!',
        claim_now: 'Отримати',

        // Токени
        unattached_tokens: 'Токени без картинок',
        attach_reminder: 'Прикріпи картинки до всіх токенів, щоб отримати більше завтра!',
        upload_photo: 'Завантажити фото',
        generate_ai: 'Створити AI',

        // Статистика
        total_tokens: 'Всього токенів',
        with_pictures: 'З картинками',
        experience: 'Досвід',
        referrals: 'Реферали',

        // Колекція
        filter_all: 'Всі',
        filter_private: 'Приватні',
        filter_public: 'Публічні',
        no_pictures: 'Поки немає картинок. Почни додавати!',

        // Запрошення
        invite_friends: 'Запросити друзів',
        total_invited: 'Всього запрошено',
        active_today: 'Активних сьогодні',
        earned_tokens: 'Зароблено токенів',
        copy_link: 'Скопіювати',
        share_link: 'Поділитися',
        referral_rewards: 'Нагороди за рефералів',
        reward_signup: '+1 токен коли друг приєднається',
        reward_daily: '+1 токен/день за активного друга',

        // Профіль
        settings: 'Налаштування',
        language: 'Мова',
        progress: 'Прогрес',
        level: 'Рівень',

        // AI Модалка
        ai_generation: 'Створення AI',
        ai_prompt_hint: 'Опиши що хочеш створити:',
        examples: 'Приклади:',
        cancel: 'Скасувати',
        generate: 'Створити',

        // Повідомлення
        link_copied: 'Посилання скопійовано!',
        claim_success: 'Ти отримав 3 токени!',
        claim_error: 'Не можеш отримати токени зараз.',
        photo_uploaded: 'Фото завантажено успішно!',
        ai_generated: 'Зображення створено!'
    },

    tr: {
        // Sekmeler
        tab_home: 'Ana Sayfa',
        tab_collection: 'Koleksiyon',
        tab_invite: 'Davet Et',
        tab_profile: 'Profil',

        // Yükleniyor
        loading: 'Yükleniyor...',

        // Günlük talep
        daily_tokens: 'Günlük Tokenlar',
        claim_available: '3 token al!',
        claim_not_available: 'Önce tüm resimleri ekle!',
        claim_already: 'Bugün zaten alındı!',
        claim_now: 'Şimdi Al',

        // Tokenlar
        unattached_tokens: 'Resimsiz Tokenlar',
        attach_reminder: 'Yarın daha fazla almak için tüm tokenlara resim ekle!',
        upload_photo: 'Fotoğraf Yükle',
        generate_ai: 'AI Oluştur',

        // İstatistikler
        total_tokens: 'Toplam Token',
        with_pictures: 'Resimli',
        experience: 'Deneyim',
        referrals: 'Yönlendirmeler',

        // Koleksiyon
        filter_all: 'Tümü',
        filter_private: 'Özel',
        filter_public: 'Genel',
        no_pictures: 'Henüz resim yok. Eklemeye başla!',

        // Davet
        invite_friends: 'Arkadaş Davet Et',
        total_invited: 'Toplam Davet',
        active_today: 'Bugün Aktif',
        earned_tokens: 'Kazanılan Token',
        copy_link: 'Bağlantıyı Kopyala',
        share_link: 'Bağlantıyı Paylaş',
        referral_rewards: 'Yönlendirme Ödülleri',
        reward_signup: 'Arkadaş katıldığında +1 token',
        reward_daily: 'Aktif arkadaş başına +1 token/gün',

        // Profil
        settings: 'Ayarlar',
        language: 'Dil',
        progress: 'İlerleme',
        level: 'Seviye',

        // AI Modal
        ai_generation: 'AI Oluşturma',
        ai_prompt_hint: 'AI için açıklama gir:',
        examples: 'Örnekler:',
        cancel: 'İptal',
        generate: 'Oluştur',

        // Mesajlar
        link_copied: 'Bağlantı panoya kopyalandı!',
        claim_success: '3 token aldın!',
        claim_error: 'Şu anda token alınamıyor.',
        photo_uploaded: 'Fotoğraf başarıyla yüklendi!',
        ai_generated: 'Görsel başarıyla oluşturuldu!'
    },

    nl: {
        // Tabbladen
        tab_home: 'Home',
        tab_collection: 'Collectie',
        tab_invite: 'Uitnodigen',
        tab_profile: 'Profiel',

        // Laden
        loading: 'Laden...',

        // Dagelijkse claim
        daily_tokens: 'Dagelijkse Tokens',
        claim_available: 'Claim 3 tokens!',
        claim_not_available: 'Voeg eerst alle afbeeldingen toe!',
        claim_already: 'Vandaag al geclaimd!',
        claim_now: 'Nu Claimen',

        // Tokens
        unattached_tokens: 'Tokens Zonder Afbeeldingen',
        attach_reminder: 'Voeg afbeeldingen toe aan alle tokens om morgen meer te krijgen!',
        upload_photo: 'Foto Uploaden',
        generate_ai: 'AI Genereren',

        // Statistieken
        total_tokens: 'Totale Tokens',
        with_pictures: 'Met Afbeeldingen',
        experience: 'Ervaring',
        referrals: 'Verwijzingen',

        // Collectie
        filter_all: 'Alle',
        filter_private: 'Privé',
        filter_public: 'Openbaar',
        no_pictures: 'Nog geen afbeeldingen. Begin met toevoegen!',

        // Uitnodiging
        invite_friends: 'Vrienden Uitnodigen',
        total_invited: 'Totaal Uitgenodigd',
        active_today: 'Vandaag Actief',
        earned_tokens: 'Verdiende Tokens',
        copy_link: 'Link Kopiëren',
        share_link: 'Link Delen',
        referral_rewards: 'Verwijzingsbeloningen',
        reward_signup: '+1 token wanneer vriend lid wordt',
        reward_daily: '+1 token/dag per actieve vriend',

        // Profiel
        settings: 'Instellingen',
        language: 'Taal',
        progress: 'Voortgang',
        level: 'Niveau',

        // AI Modal
        ai_generation: 'AI Generatie',
        ai_prompt_hint: 'Voer een beschrijving in voor AI:',
        examples: 'Voorbeelden:',
        cancel: 'Annuleren',
        generate: 'Genereren',

        // Berichten
        link_copied: 'Link gekopieerd naar klembord!',
        claim_success: 'Je hebt 3 tokens ontvangen!',
        claim_error: 'Kan nu geen tokens claimen.',
        photo_uploaded: 'Foto succesvol geüpload!',
        ai_generated: 'Afbeelding succesvol gegenereerd!'
    },

    sv: {
        // Flikar
        tab_home: 'Hem',
        tab_collection: 'Samling',
        tab_invite: 'Bjud in',
        tab_profile: 'Profil',

        // Laddar
        loading: 'Laddar...',

        // Dagligt anspråk
        daily_tokens: 'Dagliga Tokens',
        claim_available: 'Hämta 3 tokens!',
        claim_not_available: 'Bifoga alla bilder först!',
        claim_already: 'Redan hämtat idag!',
        claim_now: 'Hämta Nu',

        // Tokens
        unattached_tokens: 'Tokens Utan Bilder',
        attach_reminder: 'Bifoga bilder till alla tokens för att få mer imorgon!',
        upload_photo: 'Ladda Upp Foto',
        generate_ai: 'Generera AI',

        // Statistik
        total_tokens: 'Totala Tokens',
        with_pictures: 'Med Bilder',
        experience: 'Erfarenhet',
        referrals: 'Hänvisningar',

        // Samling
        filter_all: 'Alla',
        filter_private: 'Privata',
        filter_public: 'Offentliga',
        no_pictures: 'Inga bilder än. Börja bifoga!',

        // Inbjudan
        invite_friends: 'Bjud In Vänner',
        total_invited: 'Totalt Inbjudna',
        active_today: 'Aktiva Idag',
        earned_tokens: 'Intjänade Tokens',
        copy_link: 'Kopiera Länk',
        share_link: 'Dela Länk',
        referral_rewards: 'Hänvisningsbelöningar',
        reward_signup: '+1 token när vän går med',
        reward_daily: '+1 token/dag per aktiv vän',

        // Profil
        settings: 'Inställningar',
        language: 'Språk',
        progress: 'Framsteg',
        level: 'Nivå',

        // AI Modal
        ai_generation: 'AI Generering',
        ai_prompt_hint: 'Ange en beskrivning för AI:',
        examples: 'Exempel:',
        cancel: 'Avbryt',
        generate: 'Generera',

        // Meddelanden
        link_copied: 'Länk kopierad till urklipp!',
        claim_success: 'Du fick 3 tokens!',
        claim_error: 'Kan inte hämta tokens nu.',
        photo_uploaded: 'Foto uppladdad framgångsrikt!',
        ai_generated: 'Bild genererad framgångsrikt!'
    },

    cs: {
        // Záložky
        tab_home: 'Domů',
        tab_collection: 'Sbírka',
        tab_invite: 'Pozvat',
        tab_profile: 'Profil',

        // Načítání
        loading: 'Načítání...',

        // Denní nárok
        daily_tokens: 'Denní Tokeny',
        claim_available: 'Získej 3 tokeny!',
        claim_not_available: 'Nejprve připoj všechny obrázky!',
        claim_already: 'Dnes již získáno!',
        claim_now: 'Získat Nyní',

        // Tokeny
        unattached_tokens: 'Tokeny Bez Obrázků',
        attach_reminder: 'Připoj obrázky ke všem tokenům, abys zítra dostal více!',
        upload_photo: 'Nahrát Foto',
        generate_ai: 'Generovat AI',

        // Statistiky
        total_tokens: 'Celkem Tokenů',
        with_pictures: 'S Obrázky',
        experience: 'Zkušenosti',
        referrals: 'Doporučení',

        // Sbírka
        filter_all: 'Vše',
        filter_private: 'Soukromé',
        filter_public: 'Veřejné',
        no_pictures: 'Zatím žádné obrázky. Začni připojovat!',

        // Pozvánka
        invite_friends: 'Pozvat Přátele',
        total_invited: 'Celkem Pozváno',
        active_today: 'Aktivní Dnes',
        earned_tokens: 'Vydělané Tokeny',
        copy_link: 'Kopírovat Odkaz',
        share_link: 'Sdílet Odkaz',
        referral_rewards: 'Odměny za Doporučení',
        reward_signup: '+1 token když se přítel připojí',
        reward_daily: '+1 token/den za aktivního přítele',

        // Profil
        settings: 'Nastavení',
        language: 'Jazyk',
        progress: 'Pokrok',
        level: 'Úroveň',

        // AI Modal
        ai_generation: 'AI Generování',
        ai_prompt_hint: 'Zadej popis pro AI:',
        examples: 'Příklady:',
        cancel: 'Zrušit',
        generate: 'Generovat',

        // Zprávy
        link_copied: 'Odkaz zkopírován do schránky!',
        claim_success: 'Obdržel jsi 3 tokeny!',
        claim_error: 'Nyní nelze získat tokeny.',
        photo_uploaded: 'Foto úspěšně nahráno!',
        ai_generated: 'Obrázek úspěšně vygenerován!'
    },

    ro: {
        // Ferestre
        tab_home: 'Acasă',
        tab_collection: 'Colecție',
        tab_invite: 'Invită',
        tab_profile: 'Profil',

        // Încărcare
        loading: 'Se încarcă...',

        // Revendicare zilnică
        daily_tokens: 'Jetoane Zilnice',
        claim_available: 'Revendică 3 jetoane!',
        claim_not_available: 'Atașează toate imaginile mai întâi!',
        claim_already: 'Deja revendicat astăzi!',
        claim_now: 'Revendică Acum',

        // Jetoane
        unattached_tokens: 'Jetoane Fără Imagini',
        attach_reminder: 'Atașează imagini la toate jetoanele pentru a primi mai multe mâine!',
        upload_photo: 'Încarcă Fotografie',
        generate_ai: 'Generează AI',

        // Statistici
        total_tokens: 'Total Jetoane',
        with_pictures: 'Cu Imagini',
        experience: 'Experiență',
        referrals: 'Recomandări',

        // Colecție
        filter_all: 'Toate',
        filter_private: 'Private',
        filter_public: 'Publice',
        no_pictures: 'Încă nu sunt imagini. Începe să atașezi!',

        // Invitație
        invite_friends: 'Invită Prieteni',
        total_invited: 'Total Invitați',
        active_today: 'Activi Astăzi',
        earned_tokens: 'Jetoane Câștigate',
        copy_link: 'Copiază Link',
        share_link: 'Distribuie Link',
        referral_rewards: 'Recompense pentru Recomandări',
        reward_signup: '+1 jeton când un prieten se alătură',
        reward_daily: '+1 jeton/zi per prieten activ',

        // Profil
        settings: 'Setări',
        language: 'Limbă',
        progress: 'Progres',
        level: 'Nivel',

        // Modal AI
        ai_generation: 'Generare AI',
        ai_prompt_hint: 'Introdu o descriere pentru AI:',
        examples: 'Exemple:',
        cancel: 'Anulează',
        generate: 'Generează',

        // Mesaje
        link_copied: 'Link copiat în clipboard!',
        claim_success: 'Ai primit 3 jetoane!',
        claim_error: 'Nu se pot revendica jetoane acum.',
        photo_uploaded: 'Fotografie încărcată cu succes!',
        ai_generated: 'Imagine generată cu succes!'
    },

    el: {
        // Καρτέλες
        tab_home: 'Αρχική',
        tab_collection: 'Συλλογή',
        tab_invite: 'Πρόσκληση',
        tab_profile: 'Προφίλ',

        // Φόρτωση
        loading: 'Φόρτωση...',

        // Ημερήσια αξίωση
        daily_tokens: 'Ημερήσια Tokens',
        claim_available: 'Διεκδίκησε 3 tokens!',
        claim_not_available: 'Επισύναψε πρώτα όλες τις εικόνες!',
        claim_already: 'Ήδη διεκδικήθηκε σήμερα!',
        claim_now: 'Διεκδίκηση Τώρα',

        // Tokens
        unattached_tokens: 'Tokens Χωρίς Εικόνες',
        attach_reminder: 'Επισύναψε εικόνες σε όλα τα tokens για να πάρεις περισσότερα αύριο!',
        upload_photo: 'Ανέβασμα Φωτογραφίας',
        generate_ai: 'Δημιουργία AI',

        // Στατιστικά
        total_tokens: 'Σύνολο Tokens',
        with_pictures: 'Με Εικόνες',
        experience: 'Εμπειρία',
        referrals: 'Παραπομπές',

        // Συλλογή
        filter_all: 'Όλα',
        filter_private: 'Ιδιωτικά',
        filter_public: 'Δημόσια',
        no_pictures: 'Δεν υπάρχουν ακόμα εικόνες. Ξεκίνα να επισυνάπτεις!',

        // Πρόσκληση
        invite_friends: 'Πρόσκληση Φίλων',
        total_invited: 'Σύνολο Προσκεκλημένων',
        active_today: 'Ενεργοί Σήμερα',
        earned_tokens: 'Κερδισμένα Tokens',
        copy_link: 'Αντιγραφή Συνδέσμου',
        share_link: 'Κοινοποίηση Συνδέσμου',
        referral_rewards: 'Ανταμοιβές Παραπομπών',
        reward_signup: '+1 token όταν ένας φίλος εγγραφεί',
        reward_daily: '+1 token/μέρα ανά ενεργό φίλο',

        // Προφίλ
        settings: 'Ρυθμίσεις',
        language: 'Γλώσσα',
        progress: 'Πρόοδος',
        level: 'Επίπεδο',

        // AI Modal
        ai_generation: 'Δημιουργία AI',
        ai_prompt_hint: 'Εισάγετε περιγραφή για το AI:',
        examples: 'Παραδείγματα:',
        cancel: 'Ακύρωση',
        generate: 'Δημιουργία',

        // Μηνύματα
        link_copied: 'Σύνδεσμος αντιγράφηκε στο πρόχειρο!',
        claim_success: 'Έλαβες 3 tokens!',
        claim_error: 'Δεν μπορείς να διεκδικήσεις tokens τώρα.',
        photo_uploaded: 'Η φωτογραφία ανέβηκε επιτυχώς!',
        ai_generated: 'Η εικόνα δημιουργήθηκε επιτυχώς!'
    },

    hu: {
        // Lapok
        tab_home: 'Főoldal',
        tab_collection: 'Gyűjtemény',
        tab_invite: 'Meghívás',
        tab_profile: 'Profil',

        // Betöltés
        loading: 'Betöltés...',

        // Napi igénylés
        daily_tokens: 'Napi Tokenek',
        claim_available: 'Igényelj 3 tokent!',
        claim_not_available: 'Először csatold az összes képet!',
        claim_already: 'Ma már igényelted!',
        claim_now: 'Igénylés Most',

        // Tokenek
        unattached_tokens: 'Tokenek Képek Nélkül',
        attach_reminder: 'Csatolj képeket az összes tokenhez, hogy holnap többet kapj!',
        upload_photo: 'Fotó Feltöltése',
        generate_ai: 'AI Generálás',

        // Statisztikák
        total_tokens: 'Összes Token',
        with_pictures: 'Képekkel',
        experience: 'Tapasztalat',
        referrals: 'Ajánlások',

        // Gyűjtemény
        filter_all: 'Összes',
        filter_private: 'Privát',
        filter_public: 'Nyilvános',
        no_pictures: 'Még nincsenek képek. Kezdj el csatolni!',

        // Meghívás
        invite_friends: 'Barátok Meghívása',
        total_invited: 'Összes Meghívott',
        active_today: 'Ma Aktív',
        earned_tokens: 'Szerzett Tokenek',
        copy_link: 'Link Másolása',
        share_link: 'Link Megosztása',
        referral_rewards: 'Ajánlási Jutalmak',
        reward_signup: '+1 token amikor egy barát csatlakozik',
        reward_daily: '+1 token/nap aktív barát után',

        // Profil
        settings: 'Beállítások',
        language: 'Nyelv',
        progress: 'Haladás',
        level: 'Szint',

        // AI Modal
        ai_generation: 'AI Generálás',
        ai_prompt_hint: 'Írj le egy leírást az AI számára:',
        examples: 'Példák:',
        cancel: 'Mégse',
        generate: 'Generálás',

        // Üzenetek
        link_copied: 'Link vágólapra másolva!',
        claim_success: '3 tokent kaptál!',
        claim_error: 'Most nem lehet tokeneket igényelni.',
        photo_uploaded: 'Fotó sikeresen feltöltve!',
        ai_generated: 'Kép sikeresen generálva!'
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
