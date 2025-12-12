/**
 * Script to generate all translation files for European languages
 */

const fs = require('fs');
const path = require('path');

// Base translations (will be used as template)
const baseTranslations = {
  de: {
    welcome: {
      title: "🎮 Willkommen bei KIK Picture Tokens, {{username}}!",
      received_tokens: "🎁 Sie haben {{count}} KIK-Token erhalten!",
      how_it_works: "🎨 **Wie es funktioniert:**",
      step1: "• Jeder Token braucht ein Bild (hochladen oder AI generieren)",
      step2: "• Fügen Sie ALLEN Ihren Token Bilder hinzu, um morgen 3 weitere zu erhalten",
      step3: "• Laden Sie Freunde ein und verdienen Sie täglich Bonus-Token",
      step4: "• Sammeln, handeln und leveln Sie auf!",
      first_task: "**Ihre erste Aufgabe:**",
      first_task_desc: "Fügen Sie Ihren {{count}} Token Bilder hinzu, um morgen mehr zu erhalten! 👇",
      referral_joined: "✅ Sie sind über einen Empfehlungslink beigetreten! Ihr Freund hat einen Bonus-Token erhalten."
    },
    about: {
      title: "🌟 **Was ist KIK Picture Tokens?**",
      description: "KIK Picture Tokens ist ein einzigartiges Blockchain-Spiel, bei dem Ihre Kreativität zu wertvollen digitalen Assets wird!",
      what_you_get: "**🎁 Was Sie bekommen:**",
      benefit1: "• 3 KOSTENLOSE Token jeden Tag (echtes Geld wert!)",
      benefit2: "• Verwandeln Sie Ihre Fotos in NFTs auf der Blockchain",
      benefit3: "• Generieren Sie AI-Kunstwerke mit nur Textanweisungen",
      benefit4: "• Verdienen Sie passives Einkommen durch Freunde einladen",
      benefit5: "• Handeln Sie Token auf dem globalen Marktplatz",
      tokenomics: "**💎 Tokenomics:**",
      total_supply: "Gesamtangebot: 10.000.000.000 KIK-Token",
      distribution: "Faire Verteilung - jeder startet gleich!",
      cta: "🎯 **Bereit zu starten?**\nDrücken Sie /start und erhalten Sie jetzt Ihre ersten 3 Token!"
    },
    buttons: {
      attach_picture: "🎨 Bild anhängen",
      collection: "📸 Sammlung",
      daily_claim: "🎁 Täglicher Claim",
      invite: "👥 Einladen",
      help: "ℹ️ Hilfe",
      about: "🌟 Über",
      language: "🌍 Sprache"
    }
  },
  fr: {
    welcome: {
      title: "🎮 Bienvenue sur KIK Picture Tokens, {{username}}!",
      received_tokens: "🎁 Vous avez reçu {{count}} jetons KIK!",
      how_it_works: "🎨 **Comment ça marche:**",
      step1: "• Chaque jeton a besoin d'une image (télécharger ou générer avec AI)",
      step2: "• Attachez des images à TOUS vos jetons pour en obtenir 3 de plus demain",
      step3: "• Invitez des amis et gagnez des jetons bonus quotidiennement",
      step4: "• Collectez, échangez et montez de niveau!",
      tokenomics: "**💎 Tokenomics:**",
      total_supply: "Offre totale: 10 000 000 000 jetons KIK",
      distribution: "Distribution équitable - tout le monde commence à égalité!"
    },
    buttons: {
      attach_picture: "🎨 Attacher image",
      collection: "📸 Collection",
      daily_claim: "🎁 Réclamation quotidienne",
      invite: "👥 Inviter",
      help: "ℹ️ Aide",
      language: "🌍 Langue"
    }
  },
  es: {
    welcome: {
      title: "🎮 ¡Bienvenido a KIK Picture Tokens, {{username}}!",
      received_tokens: "🎁 ¡Has recibido {{count}} tokens KIK!",
      how_it_works: "🎨 **Cómo funciona:**",
      step1: "• Cada token necesita una imagen (subir o generar con IA)",
      step2: "• Adjunta imágenes a TODOS tus tokens para obtener 3 más mañana",
      step3: "• Invita amigos y gana tokens de bonificación diariamente",
      tokenomics: "**💎 Tokenomics:**",
      total_supply: "Suministro total: 10.000.000.000 tokens KIK",
      distribution: "Distribución justa - ¡todos empiezan igual!"
    },
    buttons: {
      attach_picture: "🎨 Adjuntar imagen",
      collection: "📸 Colección",
      daily_claim: "🎁 Reclamación diaria",
      invite: "👥 Invitar"
    }
  },
  it: {
    welcome: {
      title: "🎮 Benvenuto su KIK Picture Tokens, {{username}}!",
      received_tokens: "🎁 Hai ricevuto {{count}} token KIK!",
      tokenomics: "**💎 Tokenomics:**",
      total_supply: "Fornitura totale: 10.000.000.000 token KIK"
    },
    buttons: {
      attach_picture: "🎨 Allega immagine",
      collection: "📸 Collezione"
    }
  },
  pt: {
    welcome: {
      title: "🎮 Bem-vindo ao KIK Picture Tokens, {{username}}!",
      received_tokens: "🎁 Você recebeu {{count}} tokens KIK!",
      tokenomics: "**💎 Tokenomics:**",
      total_supply: "Oferta total: 10.000.000.000 tokens KIK"
    }
  },
  nl: {
    welcome: {
      title: "🎮 Welkom bij KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Tokenomics:**",
      total_supply: "Totaal aanbod: 10.000.000.000 KIK tokens"
    }
  },
  pl: {
    welcome: {
      title: "🎮 Witamy w KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Tokenomika:**",
      total_supply: "Całkowita podaż: 10 000 000 000 tokenów KIK"
    }
  },
  uk: {
    welcome: {
      title: "🎮 Ласкаво просимо до KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Токеноміка:**",
      total_supply: "Загальна пропозиція: 10 000 000 000 токенів KIK"
    }
  },
  cs: {
    welcome: {
      title: "🎮 Vítejte v KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Tokenomika:**",
      total_supply: "Celková nabídka: 10 000 000 000 KIK tokenů"
    }
  },
  ro: {
    welcome: {
      title: "🎮 Bun venit la KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Tokenomics:**",
      total_supply: "Ofertă totală: 10.000.000.000 tokenuri KIK"
    }
  },
  hu: {
    welcome: {
      title: "🎮 Üdvözöljük a KIK Picture Tokens-ban, {{username}}!",
      tokenomics: "**💎 Tokenomika:**",
      total_supply: "Teljes kínálat: 10 000 000 000 KIK token"
    }
  },
  sv: {
    welcome: {
      title: "🎮 Välkommen till KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Tokenomics:**",
      total_supply: "Total tillgång: 10 000 000 000 KIK tokens"
    }
  },
  el: {
    welcome: {
      title: "🎮 Καλώς ήρθατε στο KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Tokenomics:**",
      total_supply: "Συνολική προσφορά: 10.000.000.000 KIK tokens"
    }
  },
  bg: {
    welcome: {
      title: "🎮 Добре дошли в KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Токеномика:**",
      total_supply: "Обща доставка: 10 000 000 000 KIK токена"
    }
  },
  da: {
    welcome: {
      title: "🎮 Velkommen til KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Tokenomics:**",
      total_supply: "Samlet udbud: 10.000.000.000 KIK tokens"
    }
  },
  fi: {
    welcome: {
      title: "🎮 Tervetuloa KIK Picture Tokensiin, {{username}}!",
      tokenomics: "**💎 Tokenomiikka:**",
      total_supply: "Kokonaistarjonta: 10 000 000 000 KIK-tokenia"
    }
  },
  sk: {
    welcome: {
      title: "🎮 Vitajte v KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Tokenomika:**",
      total_supply: "Celková ponuka: 10 000 000 000 KIK tokenov"
    }
  },
  no: {
    welcome: {
      title: "🎮 Velkommen til KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Tokenomics:**",
      total_supply: "Totalt tilbud: 10 000 000 000 KIK tokens"
    }
  },
  hr: {
    welcome: {
      title: "🎮 Dobrodošli u KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Tokenomika:**",
      total_supply: "Ukupna ponuda: 10 000 000 000 KIK tokena"
    }
  },
  lt: {
    welcome: {
      title: "🎮 Sveiki atvykę į KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Tokenomika:**",
      total_supply: "Bendra pasiūla: 10 000 000 000 KIK žetonų"
    }
  },
  sl: {
    welcome: {
      title: "🎮 Dobrodošli v KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Tokenomika:**",
      total_supply: "Skupna ponudba: 10 000 000 000 KIK žetonov"
    }
  },
  lv: {
    welcome: {
      title: "🎮 Laipni lūdzam KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Tokenomika:**",
      total_supply: "Kopējais piedāvājums: 10 000 000 000 KIK žetonu"
    }
  },
  et: {
    welcome: {
      title: "🎮 Tere tulemast KIK Picture Tokens'i, {{username}}!",
      tokenomics: "**💎 Tokenomics:**",
      total_supply: "Kogu pakkumine: 10 000 000 000 KIK märki"
    }
  },
  ga: {
    welcome: {
      title: "🎮 Fáilte go KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Tokenomics:**",
      total_supply: "Soláthar iomlán: 10,000,000,000 comhartha KIK"
    }
  },
  mt: {
    welcome: {
      title: "🎮 Merħba għal KIK Picture Tokens, {{username}}!",
      tokenomics: "**💎 Tokenomics:**",
      total_supply: "Provvista totali: 10,000,000,000 tokens KIK"
    }
  },
  tr: {
    welcome: {
      title: "🎮 KIK Picture Tokens'a hoş geldiniz, {{username}}!",
      tokenomics: "**💎 Tokenomiks:**",
      total_supply: "Toplam arz: 10.000.000.000 KIK token"
    }
  }
};

// Function to create a full translation file from base
function createFullTranslation(baseObj) {
  // Start with English as template and merge with language-specific translations
  const enTemplate = require('./src/locales/en.json');
  
  // Deep merge function
  function deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target))
            Object.assign(output, { [key]: source[key] });
          else
            output[key] = deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }
  
  function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
  
  return deepMerge(enTemplate, baseObj);
}

// Create all translation files
const localesDir = path.join(__dirname, 'src', 'locales');

// Ensure locales directory exists
if (!fs.existsSync(localesDir)) {
  fs.mkdirSync(localesDir, { recursive: true });
}

// Generate files for each language
Object.keys(baseTranslations).forEach(lang => {
  const fullTranslation = createFullTranslation(baseTranslations[lang]);
  const filePath = path.join(localesDir, `${lang}.json`);
  
  fs.writeFileSync(filePath, JSON.stringify(fullTranslation, null, 2), 'utf8');
  console.log(`✅ Created ${lang}.json`);
});

console.log('\n🎉 All translation files created successfully!');
console.log(`📁 Location: ${localesDir}`);
console.log(`🌍 Languages: ${Object.keys(baseTranslations).length}`);
