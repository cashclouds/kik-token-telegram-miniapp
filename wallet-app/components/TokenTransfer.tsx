'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

interface Token {
  id: string;
  pictureId: string;
  pictureUrl: string;
  isRented: boolean;
}

export function TokenTransfer() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transfer' | 'history'>('transfer');

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
      isRented: true
    },
    {
      id: 'token_3',
      pictureId: 'pic_3',
      pictureUrl: 'https://via.placeholder.com/150?text=KIK+Token+3',
      isRented: false
    }
  ];

  // Mock transfer history
  const mockTransferHistory = [
    {
      transferId: 'transfer_1',
      tokenId: 'token_1',
      pictureUrl: 'https://via.placeholder.com/50?text=T1',
      toUser: 'Иван Петров',
      amount: 1,
      timestamp: '2024-12-10T14:30:00',
      status: 'completed',
      txHash: '0x123...456'
    },
    {
      transferId: 'transfer_2',
      tokenId: 'token_3',
      pictureUrl: 'https://via.placeholder.com/50?text=T3',
      toUser: 'Мария Иванова',
      amount: 1,
      timestamp: '2024-12-08T09:15:00',
      status: 'completed',
      txHash: '0x789...012'
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

  const handleTransfer = async () => {
    if (!selectedToken || !recipient) {
      setError('Пожалуйста, выберите токен и введите адрес получателя');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // TODO: Replace with real API call
      // const response = await fetch('/api/tokens/transfer', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     tokenId: selectedToken.id,
      //     recipientAddress: recipient
      //   })
      // });
      // const data = await response.json();

      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess(`Токен ${selectedToken.id} успешно передан!`);
      setRecipient('');

      // Refresh tokens
      // await fetchTokens();
    } catch (err) {
      console.error('Transfer error:', err);
      setError('Не удалось передать токен');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="card text-center">
        <h3 className="text-xl font-bold mb-4">Подключите кошелёк</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Для передачи токенов подключите MetaMask
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
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('transfer')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium ${
            activeTab === 'transfer'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          📤 Передать токен
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium ${
            activeTab === 'history'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          📊 История
        </button>
      </div>

      {/* Transfer Form */}
      {activeTab === 'transfer' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Передать токен</h2>

          {/* Available Tokens */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Ваши токены</h3>

            {tokens.length === 0 ? (
              <div className="card text-center p-4">
                <p className="text-gray-600 dark:text-gray-400">
                  У вас нет токенов для передачи
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
                    {token.isRented && (
                      <p className="text-xs text-red-500">В аренде</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transfer Form */}
          {selectedToken && (
            <div className="card space-y-4">
              <h3 className="text-lg font-bold">Детали передачи</h3>

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
                    Передача токена с привязанной картинкой
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
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Вы можете ввести Ethereum адрес или Telegram username получателя
                </p>
              </div>

              <div className="card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
                <h4 className="font-bold mb-2">⚠️ Важно!</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Картинка, привязанная к токену, перейдет к новому владельцу</li>
                  <li>• Передача необратима</li>
                  <li>• Комиссия за перевод: 2%</li>
                </ul>
              </div>

              <button
                onClick={handleTransfer}
                disabled={loading || !recipient}
                className="btn btn-primary w-full"
              >
                {loading ? 'Передача...' : '📤 Передать токен'}
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

      {/* Transfer History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">История передач</h2>

          {mockTransferHistory.length === 0 ? (
            <div className="card text-center p-4">
              <p className="text-gray-600 dark:text-gray-400">
                Нет истории передач
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mockTransferHistory.map((transfer) => (
                <div key={transfer.transferId} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <img
                          src={transfer.pictureUrl}
                          alt={`Token ${transfer.tokenId}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold">Token {transfer.tokenId}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Передано: {transfer.toUser}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(transfer.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        transfer.status === 'completed'
                          ? 'bg-green-500 text-white'
                          : 'bg-yellow-500 text-black'
                      }`}>
                        {transfer.status === 'completed' ? '✅ Завершено' : '⏳ В процессе'}
                      </span>
                      {transfer.txHash && (
                        <div className="mt-1">
                          <a
                            href={`https://amoy.polygonscan.com/tx/${transfer.txHash}`}
                            target="_blank"
                            className="text-xs text-primary-600 hover:underline"
                          >
                            Просмотреть TX
                          </a>
                        </div>
                      )}
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
