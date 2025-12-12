'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface Friend {
  userId: number;
  username: string;
  level: number;
  experience: number;
  streak: number;
  lastActivity: string;
  publicPictures: number;
  isActiveToday: boolean;
}

export function FriendsList() {
  const { address, isConnected } = useAccount();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'activity'>('friends');

  // Mock data for development (replace with real API calls)
  const mockFriends: Friend[] = [
    {
      userId: 1,
      username: 'Иван Петров',
      level: 5,
      experience: 1250,
      streak: 7,
      lastActivity: '2 часа назад',
      publicPictures: 12,
      isActiveToday: true
    },
    {
      userId: 2,
      username: 'Мария Иванова',
      level: 3,
      experience: 450,
      streak: 3,
      lastActivity: '5 минут назад',
      publicPictures: 5,
      isActiveToday: true
    },
    {
      userId: 3,
      username: 'Алексей Сидоров',
      level: 2,
      experience: 180,
      streak: 2,
      lastActivity: '1 день назад',
      publicPictures: 3,
      isActiveToday: false
    }
  ];

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);

        // TODO: Replace with real API call to backend
        // const response = await fetch(`/api/friends/${userId}`);
        // const data = await response.json();

        // For now, use mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        setFriends(mockFriends);
        setError(null);
      } catch (err) {
        console.error('Error fetching friends:', err);
        setError('Не удалось загрузить список друзей');
      } finally {
        setLoading(false);
      }
    };

    if (isConnected && address) {
      fetchFriends();
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="card text-center">
        <h3 className="text-xl font-bold mb-4">Подключите кошелёк</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Для просмотра друзей подключите MetaMask
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card text-center">
        <h3 className="text-xl font-bold mb-4">Загрузка...</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Получаем информацию о друзьях
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center bg-red-50 dark:bg-red-900/20">
        <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">Ошибка</h3>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-secondary mt-4"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium ${
            activeTab === 'friends'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          👥 Друзья
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium ${
            activeTab === 'activity'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          📊 Активность
        </button>
      </div>

      {/* Friends List */}
      {activeTab === 'friends' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Ваши друзья ({friends.length})</h2>

          {friends.length === 0 ? (
            <div className="card text-center">
              <p className="text-gray-600 dark:text-gray-400">
                У вас пока нет друзей. Пригласите их через реферальную ссылку!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {friends.map((friend) => (
                <div key={friend.userId} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {friend.username.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold">{friend.username}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Level {friend.level} | ⭐ {friend.experience} XP
                          </span>
                          {friend.isActiveToday && (
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                              🔥 Streak: {friend.streak}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📸 {friend.publicPictures} картинок
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {friend.lastActivity}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Активность друзей</h2>

          {friends.length === 0 ? (
            <div className="card text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Нет активности для отображения
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {friends
                .filter(friend => friend.isActiveToday)
                .map((friend) => (
                  <div key={friend.userId} className="card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {friend.username.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold">{friend.username}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {friend.lastActivity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          +{friend.streak} дней подряд
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          📸 {friend.publicPictures} картинок
                        </p>
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
