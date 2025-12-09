'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { KIK_TOKEN_CONFIG } from '@/lib/kikToken';

export function SimpleWallet() {
  const [account, setAccount] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [maticBalance, setMaticBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [mounted, setMounted] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Fix hydration issue
  useEffect(() => {
    setMounted(true);
  }, []);

  // Connect wallet
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      alert('Установите MetaMask! https://metamask.io/');
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setAccount(accounts[0]);
      await loadBalances(accounts[0]);
    } catch (error: any) {
      console.error('Ошибка подключения:', error);
      alert('Ошибка подключения: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load balances
  const loadBalances = async (address: string) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Check network
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Polygon Amoy Testnet Chain ID is 80002
      if (chainId !== 80002) {
        alert(`⚠️ Неправильная сеть!\n\nВы подключены к сети: Chain ID ${chainId}\nНужна сеть: Polygon Amoy Testnet (Chain ID 80002)\n\nПереключите сеть в MetaMask!`);

        // Try to switch network automatically
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x13882' }], // 80002 in hex
          });
          // Retry loading balances after switch
          setTimeout(() => loadBalances(address), 1000);
          return;
        } catch (switchError: any) {
          console.error('Не удалось переключить сеть:', switchError);
          setBalance('0');
          setMaticBalance('0');
          return;
        }
      }

      // Get MATIC balance
      const maticBal = await provider.getBalance(address);
      setMaticBalance(ethers.formatEther(maticBal));

      // Get KIK token balance
      const contract = new ethers.Contract(
        KIK_TOKEN_CONFIG.address,
        KIK_TOKEN_CONFIG.abi,
        provider
      );
      const kikBal = await contract.balanceOf(address);
      setBalance(ethers.formatEther(kikBal));
    } catch (error: any) {
      console.error('Ошибка загрузки балансов:', error);
      alert('Ошибка загрузки балансов: ' + error.message);
    }
  };

  // Send tokens
  const sendTokens = async () => {
    if (!recipient || !amount) {
      alert('Заполните все поля');
      return;
    }

    try {
      setLoading(true);
      setTxHash('');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        KIK_TOKEN_CONFIG.address,
        KIK_TOKEN_CONFIG.abi,
        signer
      );

      const tx = await contract.transfer(recipient, ethers.parseEther(amount));
      setTxHash(tx.hash);

      await tx.wait();
      alert('Транзакция успешна!');

      // Reload balances
      await loadBalances(account);
      setRecipient('');
      setAmount('');
    } catch (error: any) {
      console.error('Ошибка отправки:', error);
      alert('Ошибка отправки: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-connect if already connected
  useEffect(() => {
    if (mounted && isMetaMaskInstalled()) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          loadBalances(accounts[0]);
        }
      });
    }
  }, [mounted]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="card max-w-md mx-auto text-center">
        <h3 className="text-xl font-bold mb-4">Загрузка...</h3>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="card max-w-md mx-auto text-center">
        <h3 className="text-xl font-bold mb-4">Подключите кошелёк</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Подключите MetaMask для использования KIK Wallet
        </p>
        <button
          onClick={connectWallet}
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? 'Подключение...' : 'Connect Wallet'}
        </button>
        {!isMetaMaskInstalled() && (
          <p className="text-sm text-red-600 mt-4">
            MetaMask не установлен.{' '}
            <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer" className="underline">
              Скачать MetaMask
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Ваш кошелёк</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Адрес:</p>
            <p className="font-mono text-sm break-all">{account}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">KIK Баланс:</p>
              <p className="text-2xl font-bold text-primary-600">{Number(balance).toLocaleString()} KIK</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">MATIC Баланс:</p>
              <p className="text-lg font-semibold">{Number(maticBalance).toFixed(4)} MATIC</p>
            </div>
          </div>
          <button
            onClick={() => loadBalances(account)}
            className="btn btn-secondary w-full text-sm"
            disabled={loading}
          >
            🔄 Обновить баланс
          </button>
        </div>
      </div>

      {/* Send Tokens */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4">Отправить KIK токены</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Адрес получателя:</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="input w-full"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Количество KIK:</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="input w-full"
              disabled={loading}
              step="0.01"
            />
          </div>
          <button
            onClick={sendTokens}
            disabled={loading || !recipient || !amount}
            className="btn btn-primary w-full"
          >
            {loading ? 'Отправка...' : '💸 Отправить'}
          </button>
          {txHash && (
            <div className="text-sm">
              <p className="text-green-600 font-medium">✅ Транзакция отправлена!</p>
              <a
                href={`https://amoy.polygonscan.com/tx/${txHash}`}
                target="_blank"
                className="text-primary-600 hover:underline break-all"
              >
                Просмотреть: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Contract Info */}
      <div className="card bg-gray-50 dark:bg-gray-800/50">
        <h3 className="text-sm font-bold mb-2">Адрес контракта KIK:</h3>
        <p className="font-mono text-xs break-all text-gray-700 dark:text-gray-300">
          {KIK_TOKEN_CONFIG.address}
        </p>
        <a
          href={`https://amoy.polygonscan.com/address/${KIK_TOKEN_CONFIG.address}`}
          target="_blank"
          className="text-xs text-primary-600 hover:underline mt-2 inline-block"
        >
          Просмотреть на Polygonscan →
        </a>
      </div>
    </div>
  );
}
