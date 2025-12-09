'use client';

import { SimpleWallet } from '@/components/SimpleWallet';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center md:justify-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">KIK Wallet</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Polygon Amoy Testnet</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4">
              Добро пожаловать в KIK Wallet
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Управляйте своими KIK токенами на Polygon блокчейне
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card text-center p-4">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-bold text-sm mb-1">Быстро</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Транзакции за секунды
              </p>
            </div>
            <div className="card text-center p-4">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-bold text-sm mb-1">Дёшево</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Комиссии ~$0.01
              </p>
            </div>
            <div className="card text-center p-4">
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-bold text-sm mb-1">Безопасно</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Ваши ключи
              </p>
            </div>
          </div>

          {/* Wallet */}
          <SimpleWallet />

          {/* Info */}
          <div className="mt-8 card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <h3 className="font-bold mb-2 text-sm">ℹ️ Важная информация</h3>
            <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
              <li>• Проверяйте адрес получателя перед отправкой</li>
              <li>• Храните seed phrase в безопасном месте</li>
              <li>• Не делитесь приватным ключом</li>
              <li>• Это тестовая сеть - для экспериментов</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-xs text-gray-600 dark:text-gray-400">
          <p>© 2024 KIK Wallet • Polygon Blockchain</p>
        </div>
      </footer>
    </main>
  );
}
