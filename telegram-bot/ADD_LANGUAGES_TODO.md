# Добавление недостающих европейских языков

## Текущая языковая поддержка (22 языка)
✅ English (en)
✅ Русский (ru)
✅ Español (es)
✅ Français (fr)
✅ Deutsch (de)
✅ Italiano (it)
✅ Polski (pl)
✅ Українська (uk)
✅ Türkçe (tr)
✅ Nederlands (nl)
✅ Svenska (sv)
✅ Čeština (cs)
✅ Română (ro)
✅ Ελληνικά (el)
✅ Magyar (hu)
✅ Português (pt)
✅ 中文 (zh)
✅ हिन्दी (hi)
✅ العربية (ar)
✅ বাংলা (bn)
✅ Bahasa Indonesia (id)
✅ 日本語 (ja)

## Недостающие европейские языки (нужно добавить)

### Балтийский регион
- ❌ 🇪🇪 Eesti (et) - Эстонский
- ❌ 🇱🇻 Latviešu (lv) - Латышский
- ❌ 🇱🇹 Lietuvių (lt) - Литовский

### Скандинавия
- ❌ 🇳🇴 Norsk (no) - Норвежский
- ❌ 🇩🇰 Dansk (da) - Датский
- ❌ 🇫🇮 Suomi (fi) - Финский
- ❌ 🇮🇸 Íslenska (is) - Исландский

### Славянские языки
- ❌ 🇸🇰 Slovenčina (sk) - Словацкий
- ❌ 🇸🇮 Slovenščina (sl) - Словенский
- ❌ 🇭🇷 Hrvatski (hr) - Хорватский
- ❌ 🇷🇸 Српски (sr) - Сербский
- ❌ 🇧🇬 Български (bg) - Болгарский

## Инструкция по добавлению

### 1. Добавить в `public/js/i18n.js`

Для каждого языка добавить объект перевода по примеру:

```javascript
et: {
    // Вкладки
    tab_home: 'Avaleht',
    tab_collection: 'Kogu',
    tab_invite: 'Kutsu',
    tab_profile: 'Profiil',
    
    // Загрузка
    loading: 'Laadimine...',
    
    // И так далее для всех ключей...
}
```

### 2. Добавить в `public/index.html`

В секцию `<select id="languageSelect">` добавить:

```html
<option value="et">🇪🇪 Eesti</option>
<option value="lv">🇱🇻 Latviešu</option>
<option value="lt">🇱🇹 Lietuvių</option>
<option value="no">🇳🇴 Norsk</option>
<option value="da">🇩🇰 Dansk</option>
<option value="fi">🇫🇮 Suomi</option>
<option value="is">🇮🇸 Íslenska</option>
<option value="sk">🇸🇰 Slovenčina</option>
<option value="sl">🇸🇮 Slovenščina</option>
<option value="hr">🇭🇷 Hrvatski</option>
<option value="sr">🇷🇸 Српски</option>
<option value="bg">🇧🇬 Български</option>
```

### 3. Создать файлы локализации для бота

В папке `src/locales/` создать файлы:
- `et.json` - эстонский
- `lv.json` - латышский
- `lt.json` - литовский
- `no.json` - норвежский
- `da.json` - датский
- `fi.json` - финский
- `is.json` - исландский
- `sk.json` - словацкий
- `sl.json` - словенский
- `hr.json` - хорватский
- `sr.json` - сербский
- `bg.json` - болгарский

## Шаблон перевода

Используйте существующие файлы `en.json` и `ru.json` как шаблон.

Все ключи для перевода:
- `tab_home`, `tab_collection`, `tab_invite`, `tab_profile`
- `loading`
- `daily_tokens`, `claim_available`, `claim_not_available`, `claim_already`, `claim_now`
- `unattached_tokens`, `attach_reminder`, `upload_photo`, `generate_ai`
- `total_tokens`, `with_pictures`, `experience`, `referrals`
- `filter_all`, `filter_private`, `filter_public`, `no_pictures`
- `invite_friends`, `total_invited`, `active_today`, `earned_tokens`
- `copy_link`, `share_link`, `referral_rewards`, `reward_signup`, `reward_daily`
- `settings`, `language`, `progress`, `level`
- `ai_generation`, `ai_prompt_hint`, `examples`, `cancel`, `generate`
- `link_copied`, `claim_success`, `claim_error`, `photo_uploaded`, `ai_generated`

## Приоритет добавления

**Высокий приоритет (Балтийский регион + большие страны):**
1. 🇪🇪 Эстонский (et)
2. 🇱🇻 Латышский (lv)
3. 🇱🇹 Литовский (lt)
4. 🇳🇴 Норвежский (no)
5. 🇩🇰 Датский (da)
6. 🇫🇮 Финский (fi)

**Средний приоритет:**
7. 🇸🇰 Словацкий (sk)
8. 🇸🇮 Словенский (sl)
9. 🇭🇷 Хорватский (hr)
10. 🇧🇬 Болгарский (bg)

**Низкий приоритет:**
11. 🇮🇸 Исландский (is)
12. 🇷🇸 Сербский (sr)

## Автоматизация

Рекомендую использовать AI для перевода на основе существующих `en.json` и `ru.json` файлов.
