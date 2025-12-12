'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface Token {
  id: string;
  pictureId: string;
  pictureUrl: string;
  isRented: boolean;
  rentalInfo?: {
    renterId: number;
    renterName: string;
    endTime: string;
  };
}

interface Rental {
  rentalId: string;
  tokenId: string;
  pictureUrl: string;
  renterName: string;
  durationMinutes: number;
  endTime: string;
  timeLeft: string;
  isRenter: boolean;
}

export function TokenRental() {
  const { address, isConnected } = useAccount();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [rentalDuration, setRentalDuration] = useState(60); // Default: 60 minutes
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rent' | 'active' | 'history'>('rent');

  // Mock data for development
  const mockTokens: Token[] = [
    {
      id: 'token_1',
      pictureId: 'pic_1',
      pictureUrl: 'https://via.placeholder.com/150?text=KIK+Token+1',
      isRented: false
    },
    {
      id: 'token_2',
      pictureId: 'pic_2',
      pictureUrl: 'https://via.placeholder.com/150?text=KIK+Token+2',
      isRented: true,
      rentalInfo: {
        renterId: 2,
        renterName: 'Мария Иванова',
        endTime: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      }
    },
    {
      id: 'token_3',
      pictureId: 'pic_3',
      pictureUrl: 'https://via.placeholder.com/150?text=KIK+Token+3',
      isRented: false
    }
  ];

  // Mock active rentals
  const mockActiveRentals: Rental[] = [
    {
      rentalId: 'rental_1',
      tokenId: 'token_2',
      pictureUrl: 'https://via.placeholder.com/50?text=T2',
      renterName: 'Мария Иванова',
      durationMinutes: 60,
      endTime: new Date(Date.now() + 3600000).toISOString(),
      timeLeft: '59m left',
      isRenter: false
    }
  ];

  // Mock rental history
  const mockRentalHistory = [
    {
      rentalId: 'rental_1',
      tokenId: 'token_1',
      pictureUrl: 'https://via.placeholder.com/50?text=T1',
      renterName: 'Иван Петров',
      durationMinutes: 30,
      startTime: '2024-12-10T14:30:00',
      endTime: '2024-12-10T15:00:00',
      status: 'completed',
      isOwner: true
    },
    {
      rentalId: 'rental_2',
      tokenId: 'token_3',
      pictureUrl: 'https://via.placeholder.com/50?text=T3',
      renterName: 'Алексей Сидоров',
      durationMinutes: 120,
      startTime: '2024-12-08T09:15:00',
      endTime: '2024-12-08T11:15:00',
      status: 'completed',
      isOwner: true
    }
  ];

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);

        // TODO: Replace with real API call
        // const response = await fetch(`/api/tokens/${address}/own`);
        // const data = await response.json();

        // For now, use mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        setTokens(mockTokens);
        setError(null);
      } catch (err) {
        console.error('Error fetching tokens:', err);
        setError('Не удалось загрузить токены');
      } finally {
        setLoading(false);
      }
    };

    if (isConnected && address) {
      fetchTokens();
    }
  }, [isConnected, address]);

  const handleRent = async () => {
    if (!selectedToken || !recipient || !rentalDuration) {
      setError('Пожалуйста, выберите токен, введите получателя и продолжительность');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // TODO: Replace with real API call
      // const response = await fetch('/api/tokens/rent', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     tokenId: selectedToken.id,
      //     recipientAddress: recipient,
      //     durationMinutes: rentalDuration
      //   })
      // });
      // const data = await response.json();

      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess(`Токен ${selectedToken.id} успешно передан в аренду на ${rentalDuration} минут!`);
      setRecipient('');
      setRentalDuration(60);

      // Refresh tokens
      // await fetchTokens();
    } catch (err) {
      console.error('Rental error:', err);
      setError('Не удалось передать токен в аренду');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (rentalId: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // TODO: Replace with real API call
      // const response = await fetch(`/api/tokens/return/${rentalId}`, {
      //   method: 'POST'
      // });
      // const data = await response.json();

      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Токен успешно возвращен владельцу!');

      // Refresh data
      // await fetchTokens();
      // await fetchActiveRentals();
    } catch (err) {
      console.error('Return error:', err);
      setError('Не удалось вернуть токен');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="card text-center">
        <h3 className="text-xl font-bold mb-4">Подключите кошелёк</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Для аренды токенов подключите MetaMask
        </p>
      </div>
    );
  }

  if (loading && tokens.length === 0) {
    return (
      <div className="card text-center">
        <h3 className="text-xl font-bold mb-4">Загрузка...</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Получаем информацию о токенах
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('rent')}
          className={`flex-1 py-2 px-4 text-sm font-medium whitespace-nowrap ${
            activeTab === 'rent'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          🔄 Сдать в аренду
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 px-4 text-sm font-medium whitespace-nowrap ${
            activeTab === 'active'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          ⏳ Активные аренды
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-4 text-sm font-medium whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          📊 История
        </button>
      </div>

      {/* Rent Form */}
      {activeTab === 'rent' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Сдать токен в аренду</h2>

          {/* Available Tokens */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Ваши токены</h3>

            {tokens.length === 0 ? (
              <div className="card text-center p-4">
                <p className="text-gray-600 dark:text-gray-400">
                  У вас нет токенов для аренды
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className={`card p-3 text-center cursor-pointer ${
                      selectedToken?.id === token.id
                        ? 'border-2 border-primary-500'
                        : 'border border-gray-200 dark:border-gray-700'
                    } ${token.isRented ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !token.isRented && setSelectedToken(token)}
                  >
                    <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-2 overflow-hidden">
                      <img
                        src={token.pictureUrl}
                        alt={`Token ${token.id}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-medium">Token {token.id}</p>
                    {token.isRented ? (
                      <p className="text-xs text-red-500">В аренде</p>
                    ) : (
                      <p className="text-xs text-green-500">Доступен</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rent Form */}
          {selectedToken && (
            <div className="card space-y-4">
              <h3 className="text-lg font-bold">Детали аренды</h3>

              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={selectedToken.pictureUrl}
                    alt={`Token ${selectedToken.id}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium">Token {selectedToken.id}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Временная передача токена с картинкой
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Адрес получателя (кошелёк или Telegram ID)
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="0x... или @username"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Продолжительность аренды (минут)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    className="input w-full"
                    min="1"
                    max="43200" // 30 days
                    value={rentalDuration}
                    onChange={(e) => setRentalDuration(Math.min(43200, Math.max(1, parseInt(e.target.value) || 1)))}
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {rentalDuration} мин ({Math.floor(rentalDuration / 60)}ч {rentalDuration % 60}м)
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Максимум: 30 дней (43200 минут)
                </p>
              </div>

              <div className="card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
                <h4 className="font-bold mb-2">ℹ️ Как работает аренда:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Токен будет временно передан получателю</li>
                  <li>• Картинка будет видна получателю на время аренды</li>
                  <li>• Токен автоматически вернется по истечении времени</li>
                  <li>• Вы можете вернуть токен досрочно</li>
                  <li>• Комиссия за аренду: 1%</li>
                </ul>
              </div>

              <button
                onClick={handleRent}
                disabled={loading || !recipient}
                className="btn btn-primary w-full"
              >
                {loading ? 'Аренда...' : '🔄 Сдать в аренду'}
              </button>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="card bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="card bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
              <p className="text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}
        </div>
      )}

      {/* Active Rentals */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Активные аренды</h2>

          {mockActiveRentals.length === 0 ? (
            <div className="card text-center p-4">
              <p className="text-gray-600 dark:text-gray-400">
                Нет активных аренд
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mockActiveRentals.map((rental) => (
                <div key={rental.rentalId} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <img
                          src={rental.pictureUrl}
                          alt={`Token ${rental.tokenId}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold">Token {rental.tokenId}</p>
                        {rental.isRenter ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Арендован у: {rental.renterName}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Арендатор: {rental.renterName}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Завершение: {new Date(rental.endTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold mb-1">{rental.timeLeft}</p>
                      {!rental.isRenter && (
                        <button
                          onClick={() => handleReturn(rental.rentalId)}
                          className="btn btn-secondary text-xs"
                          disabled={loading}
                        >
                          🔙 Вернуть досрочно
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rental History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">История аренды</h2>

          {mockRentalHistory.length === 0 ? (
            <div className="card text-center p-4">
              <p className="text-gray-600 dark:text-gray-400">
                Нет истории аренды
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mockRentalHistory.map((rental) => (
                <div key={rental.rentalId} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <img
                          src={rental.pictureUrl}
                          alt={`Token ${rental.tokenId}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold">Token {rental.tokenId}</p>
                        {rental.isOwner ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Арендован: {rental.renterName}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Аренда у: {rental.renterName}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(rental.startTime).toLocaleDateString()} -
                          {new Date(rental.endTime).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Продолжительность: {rental.durationMinutes} минут
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        rental.status === 'completed'
                          ? 'bg-green-500 text-white'
                          : 'bg-yellow-500 text-black'
                      }`}>
                        {rental.status === 'completed' ? '✅ Завершено' : '⏳ В процессе'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
