'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface UserLevelData {
  level: number;
  experience: number;
  nextLevelExperience: number;
  progress: number;
}

export function UserLevel() {
  const { address, isConnected } = useAccount();
  const [levelData, setLevelData] = useState<UserLevelData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development
  const mockLevelData: UserLevelData = {
    level: 3,
    experience: 245,
    nextLevelExperience: 400,
    progress: 61
  };

  useEffect(() => {
    const fetchLevelData = async () => {
      try {
        setLoading(true);

        // TODO: Replace with real API call to backend
        // const response = await fetch(`/api/level/${address}`);
        // const data = await response.json();

        // For now, use mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        setLevelData(mockLevelData);
        setError(null);
      } catch (err) {
        console.error('Error fetching level data:', err);
        setError('Не удалось загрузить информацию об уровне');
      } finally {
        setLoading(false);
      }
    };

    if (isConnected && address) {
      fetchLevelData();
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="card text-center">
        <h3 className="text-xl font-bold mb-4">Подключите кошелёк</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Для просмотра уровня подключите MetaMask
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card text-center">
        <h3 className="text-xl font-bold mb-4">Загрузка...</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Получаем информацию об уровне
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

  if (!levelData) {
    return (
      <div className="card text-center">
        <h3 className="text-xl font-bold mb-4">Нет данных</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Информация об уровне недоступна
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">Ваш уровень</h2>

      <div className="space-y-6">
        {/* Level Info */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-3xl font-bold">
                {levelData.level}
              </span>
            </div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                ⭐ {levelData.experience} XP
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Уровень {levelData.level}</span>
            <span>Уровень {levelData.level + 1}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full"
              style={{ width: `${levelData.progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{levelData.experience} / {levelData.nextLevelExperience} XP</span>
            <span>{levelData.progress}%</span>
          </div>
        </div>

        {/* Level Benefits */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg">Преимущества уровня {levelData.level}</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Ежедневный бонус: +{levelData.level} KIK
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Макс. друзей: {levelData.level * 10}
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Бонус за рефералов: +{levelData.level}%
            </li>
          </ul>
        </div>

        {/* Next Level Info */}
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg">
          <h3 className="font-bold mb-2">Следующий уровень ({levelData.level + 1})</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Нужно еще {levelData.nextLevelExperience - levelData.experience} XP
          </p>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">🎁</span>
            </div>
            <span className="text-sm">Новые преимущества: +10% бонусов</span>
          </div>
        </div>
      </div>
    </div>
  );
}
