'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { useState, useEffect } from 'react';
import { KIK_TOKEN_CONFIG } from '@/lib/kikToken';

export function WalletDashboard() {
  const { address, isConnected } = useAccount();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [mintRecipient, setMintRecipient] = useState('');

  // Read token balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    ...KIK_TOKEN_CONFIG,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Read token info
  const { data: tokenName } = useReadContract({
    ...KIK_TOKEN_CONFIG,
    functionName: 'name',
  });

  const { data: tokenSymbol } = useReadContract({
    ...KIK_TOKEN_CONFIG,
    functionName: 'symbol',
  });

  const { data: totalSupply } = useReadContract({
    ...KIK_TOKEN_CONFIG,
    functionName: 'totalSupply',
  });

  const { data: isPaused } = useReadContract({
    ...KIK_TOKEN_CONFIG,
    functionName: 'paused',
  });

  const { data: owner } = useReadContract({
    ...KIK_TOKEN_CONFIG,
    functionName: 'owner',
  });

  // Write functions
  const { 
    data: transferHash, 
    writeContract: transfer,
    isPending: isTransferPending 
  } = useWriteContract();

  const {
    data: mintHash,
    writeContract: mint,
    isPending: isMintPending
  } = useWriteContract();

  const {
    writeContract: pause,
    isPending: isPausePending
  } = useWriteContract();

  const {
    writeContract: unpause,
    isPending: isUnpausePending
  } = useWriteContract();

  // Wait for transaction confirmations
  const { isLoading: isTransferConfirming, isSuccess: isTransferSuccess } = 
    useWaitForTransactionReceipt({ hash: transferHash });

  const { isLoading: isMintConfirming, isSuccess: isMintSuccess } = 
    useWaitForTransactionReceipt({ hash: mintHash });

  // Refetch balance after successful transactions
  useEffect(() => {
    if (isTransferSuccess || isMintSuccess) {
      refetchBalance();
    }
  }, [isTransferSuccess, isMintSuccess, refetchBalance]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;

    try {
      transfer({
        ...KIK_TOKEN_CONFIG,
        functionName: 'transfer',
        args: [recipient as `0x${string}`, parseEther(amount)],
      });
      setRecipient('');
      setAmount('');
    } catch (error) {
      console.error('Transfer error:', error);
    }
  };

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mintRecipient || !mintAmount) return;

    try {
      mint({
        ...KIK_TOKEN_CONFIG,
        functionName: 'mint',
        args: [mintRecipient as `0x${string}`, parseEther(mintAmount)],
      });
      setMintRecipient('');
      setMintAmount('');
    } catch (error) {
      console.error('Mint error:', error);
    }
  };

  const handlePause = () => {
    pause({
      ...KIK_TOKEN_CONFIG,
      functionName: 'pause',
      value: parseEther('0.01'), // Pause fee
    });
  };

  const handleUnpause = () => {
    unpause({
      ...KIK_TOKEN_CONFIG,
      functionName: 'unpause',
    });
  };

  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

  if (!isConnected) {
    return (
      <div className="card text-center">
        <h2 className="text-2xl font-bold mb-4">Подключите кошелёк</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Пожалуйста, подключите MetaMask или другой Web3 кошелёк для использования KIK Wallet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Token Info Card */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Информация о токене</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Название</p>
            <p className="text-lg font-semibold">{tokenName || 'Loading...'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Символ</p>
            <p className="text-lg font-semibold">{tokenSymbol || 'Loading...'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Общее количество</p>
            <p className="text-lg font-semibold">
              {totalSupply ? formatEther(totalSupply) : 'Loading...'} KIK
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Статус</p>
            <p className={`text-lg font-semibold ${isPaused ? 'text-red-500' : 'text-green-500'}`}>
              {isPaused ? '⏸️ Приостановлен' : '▶️ Активен'}
            </p>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <h2 className="text-xl mb-2">Ваш баланс</h2>
        <p className="text-4xl font-bold">
          {balance ? formatEther(balance) : '0'} KIK
        </p>
        <p className="text-sm opacity-80 mt-2">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
      </div>

      {/* Transfer Card */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Отправить KIK</h2>
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Адрес получателя
            </label>
            <input
              type="text"
              className="input"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={isPaused || isTransferPending || isTransferConfirming}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Количество KIK
            </label>
            <input
              type="number"
              step="0.000001"
              className="input"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isPaused || isTransferPending || isTransferConfirming}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isPaused || isTransferPending || isTransferConfirming || !recipient || !amount}
          >
            {isTransferPending || isTransferConfirming ? 'Отправка...' : 'Отправить'}
          </button>
          {isTransferSuccess && (
            <p className="text-green-500 text-sm">✅ Транзакция успешна!</p>
          )}
          {isPaused && (
            <p className="text-red-500 text-sm">⚠️ Транзакции приостановлены</p>
          )}
        </form>
      </div>

      {/* Owner Controls */}
      {isOwner && (
        <>
          {/* Mint Card */}
          <div className="card border-2 border-yellow-500">
            <h2 className="text-2xl font-bold mb-4">🔐 Создать токены (Владелец)</h2>
            <form onSubmit={handleMint} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Адрес получателя
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="0x..."
                  value={mintRecipient}
                  onChange={(e) => setMintRecipient(e.target.value)}
                  disabled={isMintPending || isMintConfirming}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Количество KIK
                </label>
                <input
                  type="number"
                  step="0.000001"
                  className="input"
                  placeholder="0.0"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  disabled={isMintPending || isMintConfirming}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isMintPending || isMintConfirming || !mintRecipient || !mintAmount}
              >
                {isMintPending || isMintConfirming ? 'Создание...' : 'Создать токены'}
              </button>
              {isMintSuccess && (
                <p className="text-green-500 text-sm">✅ Токены созданы!</p>
              )}
            </form>
          </div>

          {/* Pause Controls */}
          <div className="card border-2 border-red-500">
            <h2 className="text-2xl font-bold mb-4">⏯️ Управление паузой (Владелец)</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Приостановка транзакций может быть полезна для безопасности в экстренных ситуациях
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handlePause}
                  className="btn bg-yellow-500 hover:bg-yellow-600 text-white flex-1"
                  disabled={isPaused || isPausePending}
                >
                  {isPausePending ? 'Приостановка...' : '⏸️ Приостановить'}
                </button>
                <button
                  onClick={handleUnpause}
                  className="btn bg-green-500 hover:bg-green-600 text-white flex-1"
                  disabled={!isPaused || isUnpausePending}
                >
                  {isUnpausePending ? 'Активация...' : '▶️ Активировать'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
