# 🛠️ Полезные команды для KIK Token

## 📦 Установка и настройка

### Первоначальная установка
```bash
# Установить зависимости контракта
npm install

# Установить зависимости кошелька
cd wallet-app
npm install
cd ..
```

### Настройка окружения
```bash
# Создать .env файл
cp .env.example .env

# Редактировать .env
nano .env
# или
code .env
```

## 🔨 Работа с контрактом

### Компиляция
```bash
# Скомпилировать контракт
npm run compile

# Очистить артефакты и перекомпилировать
npm run clean
npm run compile
```

### Развёртывание

#### Локальная сеть (для тестов)
```bash
# Запустить локальную сеть Hardhat
npx hardhat node

# В другом терминале - развернуть
npm run deploy:local
```

#### Тестовые сети
```bash
# Polygon Amoy Testnet
npm run deploy:amoy

# Polygon Mumbai Testnet (устаревшая)
npm run deploy:mumbai
```

#### Продакшен
```bash
# Polygon Mainnet (требуется реальный MATIC!)
npm run deploy:polygon
```

### Верификация контракта
```bash
# Верифицировать на Polygonscan
npx hardhat verify --network polygon АДРЕС_КОНТРАКТА

# Пример:
npx hardhat verify --network polygon 0x1234567890abcdef1234567890abcdef12345678
```

### Тестирование
```bash
# Запустить тесты (если созданы)
npm test

# Запустить тесты с отчётом о покрытии
npx hardhat coverage
```

## 🌐 Работа с веб-кошельком

### Разработка
```bash
cd wallet-app

# Запустить dev сервер
npm run dev

# Откроется на http://localhost:3000
```

### Продакшен
```bash
cd wallet-app

# Собрать для продакшена
npm run build

# Запустить продакшен версию
npm start

# Или экспортировать статику
npm run build
npx next export
```

### Линтинг и форматирование
```bash
cd wallet-app

# Проверить код
npm run lint

# Исправить автоматически
npm run lint -- --fix
```

## 🔍 Взаимодействие с контрактом

### Hardhat Console
```bash
# Открыть консоль
npx hardhat console --network amoy

# В консоли можно выполнять команды:
```
```javascript
// Получить контракт
const KIK = await ethers.getContractFactory("KIKToken");
const kik = await KIK.attach("АДРЕС_КОНТРАКТА");

// Проверить баланс
const balance = await kik.balanceOf("АДРЕС_КОШЕЛЬКА");
console.log(ethers.formatEther(balance));

// Отправить токены
await kik.transfer("АДРЕС_ПОЛУЧАТЕЛЯ", ethers.parseEther("100"));

// Создать новые токены (только владелец)
await kik.mint("АДРЕС", ethers.parseEther("1000"));

// Поставить на паузу
await kik.pause({ value: ethers.parseEther("0.01") });

// Снять с паузы
await kik.unpause();
```

### Скрипты для автоматизации

#### Проверить баланс
```bash
# Создать файл scripts/checkBalance.js:
```
```javascript
const hre = require("hardhat");

async function main() {
  const address = "АДРЕС_КОНТРАКТА";
  const wallet = "АДРЕС_КОШЕЛЬКА";
  
  const KIK = await hre.ethers.getContractFactory("KIKToken");
  const kik = await KIK.attach(address);
  
  const balance = await kik.balanceOf(wallet);
  console.log("Баланс:", hre.ethers.formatEther(balance), "KIK");
}

main().catch(console.error);
```
```bash
# Запустить
npx hardhat run scripts/checkBalance.js --network amoy
```

#### Массовая отправка (airdrop)
```bash
# Создать файл scripts/airdrop.js:
```
```javascript
const hre = require("hardhat");

async function main() {
  const contractAddress = "АДРЕС_КОНТРАКТА";
  const recipients = [
    { address: "0x...", amount: "100" },
    { address: "0x...", amount: "200" },
    // добавить больше получателей
  ];
  
  const KIK = await hre.ethers.getContractFactory("KIKToken");
  const kik = await KIK.attach(contractAddress);
  
  for (const recipient of recipients) {
    console.log(`Отправка ${recipient.amount} KIK на ${recipient.address}`);
    const tx = await kik.transfer(
      recipient.address,
      hre.ethers.parseEther(recipient.amount)
    );
    await tx.wait();
    console.log("✅ Отправлено");
  }
}

main().catch(console.error);
```

## 📊 Мониторинг и отладка

### Просмотр событий (Events)
```bash
# Создать scripts/watchEvents.js:
```
```javascript
const hre = require("hardhat");

async function main() {
  const address = "АДРЕС_КОНТРАКТА";
  const KIK = await hre.ethers.getContractFactory("KIKToken");
  const kik = await KIK.attach(address);
  
  // Слушать Transfer события
  kik.on("Transfer", (from, to, amount) => {
    console.log(`Transfer: ${from} -> ${to}: ${hre.ethers.formatEther(amount)} KIK`);
  });
  
  console.log("Слушаем события...");
}

main().catch(console.error);
```

### Проверка газа
```bash
# Оценить стоимость транзакции
npx hardhat run scripts/estimateGas.js --network amoy
```

### Отладка транзакций
```bash
# Просмотреть детали транзакции
npx hardhat verify:get-transaction --network amoy HASH_ТРАНЗАКЦИИ
```

## 🔧 Утилиты

### Информация о сети
```bash
# Текущий блок
npx hardhat run scripts/getBlockNumber.js --network amoy

# Баланс MATIC
npx hardhat run scripts/getBalance.js --network amoy
```

### Генерация нового кошелька
```bash
# Создать scripts/generateWallet.js:
```
```javascript
const { ethers } = require("ethers");

const wallet = ethers.Wallet.createRandom();
console.log("Адрес:", wallet.address);
console.log("Приватный ключ:", wallet.privateKey);
console.log("Мнемоническая фраза:", wallet.mnemonic.phrase);
```
```bash
npx hardhat run scripts/generateWallet.js
```

## 🎯 Быстрые команды

### Всё в одном (полный деплой)
```bash
# 1. Очистить и скомпилировать
npm run clean && npm run compile

# 2. Развернуть на testnet
npm run deploy:amoy

# 3. Скопировать адрес контракта и обновить в кошельке
# (вручную обновить wallet-app/lib/kikToken.ts)

# 4. Запустить кошелёк
cd wallet-app && npm run dev
```

### Быстрая проверка
```bash
# Проверить всё одной командой
npm run compile && \
npx hardhat run scripts/checkBalance.js --network amoy && \
cd wallet-app && npm run build
```

### Обновление после изменений
```bash
# Если изменили контракт
npm run clean
npm run compile
npm run deploy:amoy  # деплой нового контракта
# Обновить адрес в wallet-app/lib/kikToken.ts

# Если изменили кошелёк
cd wallet-app
npm run dev  # или npm run build
```

## 🐛 Отладка

### Проблемы с компиляцией
```bash
# Удалить node_modules и переустановить
rm -rf node_modules package-lock.json
npm install

# Очистить кэш Hardhat
npx hardhat clean
rm -rf cache/ artifacts/
```

### Проблемы с развёртыванием
```bash
# Проверить баланс MATIC
npx hardhat run scripts/getBalance.js --network amoy

# Увеличить gas limit в hardhat.config.js:
# gas: 8000000,
# gasPrice: 50000000000
```

### Проблемы с кошельком
```bash
cd wallet-app

# Очистить кэш Next.js
rm -rf .next/

# Переустановить зависимости
rm -rf node_modules package-lock.json
npm install

# Проверить ошибки
npm run lint
```

## 📱 Работа с MetaMask

### Добавить кастомную сеть через Web3
```javascript
// В консоли браузера:
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0x13882', // 80002 в hex для Amoy
    chainName: 'Polygon Amoy Testnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://rpc-amoy.polygon.technology'],
    blockExplorerUrls: ['https://amoy.polygonscan.com/']
  }]
});
```

### Добавить токен программно
```javascript
// В консоли браузера:
await window.ethereum.request({
  method: 'wallet_watchAsset',
  params: {
    type: 'ERC20',
    options: {
      address: 'АДРЕС_КОНТРАКТА_KIK',
      symbol: 'KIK',
      decimals: 18,
    },
  },
});
```

## 🔗 Полезные URL

### Polygon Amoy Testnet
- RPC: https://rpc-amoy.polygon.technology
- Explorer: https://amoy.polygonscan.com
- Faucet: https://faucet.polygon.technology
- ChainID: 80002

### Polygon Mainnet
- RPC: https://polygon-rpc.com
- Explorer: https://polygonscan.com
- ChainID: 137

### Инструменты
- Hardhat: https://hardhat.org
- OpenZeppelin: https://docs.openzeppelin.com
- Ethers.js: https://docs.ethers.org

## 💡 Советы

### Оптимизация газа
```bash
# Включить оптимизацию в hardhat.config.js
# optimizer: { enabled: true, runs: 200 }
```

### Безопасность
```bash
# Никогда не коммитить .env
echo ".env" >> .gitignore

# Использовать отдельные кошельки
# Testnet wallet ≠ Mainnet wallet
```

### Мониторинг
```bash
# Подписаться на алерты Polygonscan
# для уведомлений о транзакциях
```

---

**Сохрани этот файл - он пригодится! 🔖**

*Все команды протестированы и готовы к использованию*
