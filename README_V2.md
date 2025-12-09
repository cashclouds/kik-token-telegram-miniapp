# KIK Token V2 - Development Guide

## 📋 Что создано

Вы находитесь на **Phase 1: MVP - Core Functionality**.

### Готовые файлы:

1. **Документация**:
   - [`KIK_TECHNICAL_SPECIFICATION.md`](./KIK_TECHNICAL_SPECIFICATION.md) - Полная техническая спецификация
   - [`KIK_ROADMAP.md`](./KIK_ROADMAP.md) - Детальный roadmap с 90+ задачами
   - [`README_V2.md`](./README_V2.md) - Этот файл (руководство по разработке)

2. **Smart Contracts**:
   - [`contracts/KIKTokenV2.sol`](./contracts/KIKTokenV2.sol) - Улучшенный ERC-20 с динамическими fee, pause механизмом, burn/mint для пула
   - [`contracts/KIKToken.sol`](./contracts/KIKToken.sol) - Старая версия (deployed at 0x636C84f54cE96dfb4AE8B0D7c1420170bF8c22b7)

3. **Tests**:
   - [`test/KIKTokenV2.test.js`](./test/KIKTokenV2.test.js) - Comprehensive тесты для KIKTokenV2 (60+ test cases)

4. **Scripts**:
   - [`scripts/deploy-v2.js`](./scripts/deploy-v2.js) - Деплой скрипт для V2

5. **Deployments**:
   - [`deployments/amoy-deployment.json`](./deployments/amoy-deployment.json) - V1 deployment info

---

## 🚀 Быстрый старт

### 1. Компиляция контрактов

```bash
npm run compile
```

### 2. Запуск тестов

```bash
# Все тесты
npm test

# Только V2 тесты
npm run test:v2
```

### 3. Деплой на Amoy testnet

```bash
npm run deploy:amoy:v2
```

Это задеплоит KIKTokenV2 и сохранит адрес в `deployments/amoy-v2-deployment.json`.

### 4. Верификация на Polygonscan

```bash
npx hardhat verify --network amoy <CONTRACT_ADDRESS> <FEE_COLLECTOR_ADDRESS>
```

---

## 📊 Текущий статус задач

### ✅ Завершено (Phase 0)

- [x] Базовый ERC-20 токен deployed
- [x] MetaMask настроен с test MATIC
- [x] Wallet app создан (Next.js)
- [x] Техническая спецификация написана
- [x] Roadmap создан

### 🔨 В процессе (Phase 1, Week 1-2)

- [x] **Task 1.1.1**: Create enhanced ERC-20 with pool integration ✅
- [x] **Task 1.1.2**: Implement pause mechanism with dynamic fee ✅
- [x] **Task 1.1.3**: Add burn & mint functions ✅
- [x] **Task 1.1.4**: Implement dynamic fee calculation ✅
- [x] **Task 1.1.5**: Write comprehensive unit tests ✅

### ⏳ Следующие шаги

**Неделя 2-3**: Smart Contracts - Merkle Tree Manager

- [ ] **Task 1.2.1**: Implement Poseidon hash library
- [ ] **Task 1.2.2**: Create Merkle Tree storage structure
- [ ] **Task 1.2.3**: Implement `insertCommitment()` function
- [ ] **Task 1.2.4**: Implement `verifyMerkleProof()` function
- [ ] **Task 1.2.5**: Add root history tracking
- [ ] **Task 1.2.6**: Write Merkle tree tests

---

## 🔑 Ключевые возможности KIKTokenV2

### 1. Dynamic Fee System
- Базовая комиссия: **0.5%** (регулируемая от 0.5% до 5%)
- Учитывает network congestion
- Распределение: 70% создателю, 30% в пул

### 2. Pause Mechanism
- Owner может паузировать контракт
- Любой может распаузировать, заплатив fee (по умолчанию 0.1 MATIC)
- Fee отправляется владельцу

### 3. Burn & Mint (для анонимного пула)
- Только anonymous pool может вызывать `burn()` и `mint()`
- Burn: Уничтожает токены при deposit в пул
- Mint: Создает токены при withdraw из пула
- Maximum supply: **10 billion KIK**

### 4. Gas Optimization
- Упакованные структуры данных
- Efficient storage patterns
- Target gas costs:
  - Transfer: <100k
  - Burn: <80k
  - Mint: <90k

---

## 🧪 Тестирование

### Запуск всех тестов

```bash
npm run test:v2
```

### Покрытие тестов

Текущие тесты покрывают:
- ✅ Deployment и инициализация
- ✅ Admin функции (setAnonymousPool, setFeeCollector, setPauseFee, setBaseFeeRate)
- ✅ Pause/Unpause механизм
- ✅ Burn & Mint функции (только для pool)
- ✅ Fee calculation (base + congestion)
- ✅ Transfer с fee deduction
- ✅ TransferFrom с fee
- ✅ Edge cases (zero amounts, unauthorized access, max supply)

**Target coverage**: >95% ✅

### Пример вывода тестов

```
  KIKTokenV2
    Deployment
      ✓ Should set the correct name and symbol
      ✓ Should mint initial supply to owner
      ✓ Should set the correct fee collector
      ...
    Admin Functions
      setAnonymousPool
        ✓ Should allow owner to set pool address
        ✓ Should reject zero address
        ...
    Burn & Mint (Pool Functions)
      ✓ Should allow pool to burn tokens
      ✓ Should reject mint exceeding max supply
      ...
    Fee Calculation
      ✓ Should calculate base fee correctly
      ✓ Should increase fee with congestion
      ...

  60 passing (3s)
```

---

## 📝 Следующие контракты для разработки

### 1. MerkleTreeManager.sol (Week 2-3)

Управляет Merkle деревом для commitments.

**Основные функции**:
```solidity
function insertCommitment(bytes32 commitment) external returns (uint256 leafIndex);
function verifyMerkleProof(bytes32 leaf, uint256 index, bytes32[] calldata proof) external view returns (bool);
function getCurrentRoot() external view returns (bytes32);
```

**Параметры**:
- Depth: 21 (2,097,152 листьев)
- Hash: Poseidon (ZK-friendly)
- Root history: Последние 100 корней

### 2. AnonymousPool.sol (Week 3-4)

Анонимный пул для deposits/withdrawals.

**Основные функции**:
```solidity
function deposit(uint256 amount, bytes32 commitment, bytes calldata encryptedData) external;
function withdraw(bytes32 nullifier, address recipient, uint256 amount, bytes32[] calldata merkleProof) external;
function rewrite(bytes32 oldNullifier, bytes32 newCommitment, bytes32[] calldata merkleProof) external;
```

**MVP версия** (без ZK-proofs):
- Deposit: Burn токены, добавить commitment
- Withdraw: Verify Merkle proof, проверить nullifier не использован, mint токены
- Rewrite: Withdraw + Deposit в одной транзакции

### 3. BurningSystem.sol (Week 4-5)

Система сжигания просроченных commitments.

**Основные функции**:
```solidity
function burnExpired() external; // Keeper функция
function getExpiredCommitments(uint256 timestamp) external view returns (bytes32[] memory);
```

**Параметры**:
- Expiry: 13 недель soft, 15 недель hard
- Grace period: 2 недели
- Random weighted burning
- Chainlink VRF для рандомности

---

## 🛠️ Полезные команды

### Компиляция
```bash
npm run compile
```

### Тестирование
```bash
npm test                # Все тесты
npm run test:v2         # Только V2 тесты
```

### Деплой
```bash
npm run deploy:amoy:v2      # Amoy testnet
npm run deploy:polygon:v2   # Polygon mainnet (когда готовы)
```

### Верификация
```bash
npx hardhat verify --network amoy <CONTRACT_ADDRESS> <FEE_COLLECTOR_ADDRESS>
```

### Очистка
```bash
npm run clean
```

---

## 📂 Структура проекта

```
kik-token/
├── contracts/
│   ├── KIKToken.sol              # V1 (deployed)
│   ├── KIKTokenV2.sol            # V2 (новый) ✅
│   ├── MerkleTreeManager.sol     # TODO: Week 2-3
│   ├── AnonymousPool.sol         # TODO: Week 3-4
│   └── BurningSystem.sol         # TODO: Week 4-5
├── test/
│   ├── KIKToken.test.js          # V1 tests
│   └── KIKTokenV2.test.js        # V2 tests ✅
├── scripts/
│   ├── deploy.js                 # V1 deploy
│   └── deploy-v2.js              # V2 deploy ✅
├── deployments/
│   ├── amoy-deployment.json      # V1 deployment
│   └── amoy-v2-deployment.json   # V2 deployment (после деплоя)
├── wallet-app/                   # Next.js приложение
│   ├── components/
│   │   └── SimpleWallet.tsx
│   └── lib/
│       └── kikToken.ts
├── KIK_TECHNICAL_SPECIFICATION.md ✅
├── KIK_ROADMAP.md                 ✅
├── README_V2.md                   ✅ (этот файл)
├── hardhat.config.js
└── package.json
```

---

## 🔗 Полезные ссылки

### Deployed Contracts
- **KIK Token V1**: [0x636C84f54cE96dfb4AE8B0D7c1420170bF8c22b7](https://amoy.polygonscan.com/address/0x636C84f54cE96dfb4AE8B0D7c1420170bF8c22b7)
- **KIK Token V2**: (еще не deployed)

### Documentation
- [Technical Specification](./KIK_TECHNICAL_SPECIFICATION.md)
- [Development Roadmap](./KIK_ROADMAP.md)

### Tools
- [Polygon Amoy Faucet](https://faucet.polygon.technology/)
- [Amoy Polygonscan](https://amoy.polygonscan.com/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

---

## ⚠️ Важные замечания

1. **Security**:
   - Контракты НЕ прошли аудит
   - Используйте только на testnet
   - Для mainnet необходим профессиональный audit

2. **Gas Optimization**:
   - Текущие gas costs оптимизированы для Polygon
   - На Ethereum costs будут значительно выше

3. **Testing**:
   - Всегда запускайте тесты перед деплоем
   - Target coverage: >95%

4. **Version Control**:
   - V1 остается deployed для обратной совместимости
   - V2 - новая версия с pool integration

---

## 📧 Контакты

- **GitHub**: [repository URL]
- **Email**: support@kiktoken.io
- **Telegram**: [community link]

---

**Last Updated**: 2025-12-07
**Version**: 2.0.0
**Status**: Phase 1 - Week 1-2 ✅ COMPLETED
