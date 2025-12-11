import React, { useState } from 'react';
import { Wallet, Shield, ArrowRight } from 'lucide-react';
import { ethers } from 'ethers';
import axios from 'axios';

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (walletType: string) => {
    if (walletType !== "MetaMask") {
      alert(`🚧 ${walletType} chưa được hỗ trợ, chỉ hỗ trợ MetaMask hiện tại.`);
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Kiểm tra có cài MetaMask chưa
      if (!window.ethereum) {
        throw new Error("Vui lòng cài đặt MetaMask trước khi tiếp tục!");
      }

      // Kiểm tra kết nối hiện tại (không mở popup nếu đã connect)
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();  // Lấy accounts hiện tại (không request)

      let address: string;

      const extractAddress = async (acct: any): Promise<string> => {
        // If it's already a string address
        if (typeof acct === 'string') return acct;
        // If it's a signer-like object with getAddress()
        if (acct && typeof acct === 'object') {
          if (typeof (acct as any).getAddress === 'function') {
            return await (acct as any).getAddress();
          }
          // Some providers return objects with an 'address' field
          if (typeof (acct as any).address === 'string') {
            return (acct as any).address;
          }
        }
        throw new Error('Không thể lấy địa chỉ từ tài khoản được trả về');
      };

      if (accounts.length === 0) {
        // Chưa connect: Yêu cầu kết nối (mở popup MetaMask)
        await window.ethereum.request({ method: "eth_requestAccounts" });
        // Sau request, lấy lại accounts
        const newAccounts = await provider.listAccounts();
        if (newAccounts.length === 0) {
          throw new Error("Người dùng từ chối kết nối ví!");
        }
        address = await extractAddress(newAccounts[0]);
      } else {
        // Đã connect: Lấy address hiện tại (không mở popup)
        address = await extractAddress(accounts[0]);
        console.log("✅ Đã kết nối sẵn:", address);
      }

      // Lấy signer từ provider (default to first account - no param to avoid type issue)
      const signer = await provider.getSigner();  // This returns JsonRpcSigner, but we use it for methods only

      // Kiểm tra network (Sepolia - chainId 11155111)
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }],  // Sepolia hex (fixed)
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            // Network chưa add: Add Sepolia
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: "0xaa36a7",
                chainName: "Sepolia Testnet",
                rpcUrls: ["https://rpc.sepolia.org"],
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              }],
            });
          } else {
            throw new Error("Vui lòng chuyển sang mạng Sepolia!");
          }
        }
      }

      // Sign message để auth với BE (order: message, address)
      const message = `Login to CarbonCredit App - ${new Date().toISOString()}`;
      const signature = await signer.signMessage(message);  // Returns Promise<string> - type-safe

      // Gọi BE API auth
      const response = await axios.post("http://localhost:8080/api/auth/login", { 
        address,
        message,
        signature
      });

      console.log("✅ Auth success:", response.data);

      // ← SỬA: Lưu token chỉ khi success và token tồn tại
      if (response.status === 200 && response.data.token) {
        localStorage.setItem("token", response.data.token);  // Lưu token vào localStorage
        console.log("Token saved to localStorage:", response.data.token.substring(0, 20) + "...");  // Debug
        onConnect(address);  // Redirect
      } else {
        throw new Error("Auth failed: No token in response");
      }

      // Lắng nghe thay đổi (reload trang để reset state)
      window.ethereum.on("accountsChanged", () => window.location.reload());
      window.ethereum.on("chainChanged", () => window.location.reload());

    } catch (error: any) {
      console.error("❌ Lỗi kết nối MetaMask:", error);
      setError(error.message || "Kết nối thất bại. Vui lòng thử lại!");
      if (error.code === 4001) {
        setError("Người dùng từ chối kết nối ví!");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const wallets = [
    {
      name: 'MetaMask',
      description: 'Connect using MetaMask wallet',
      icon: '🦊',
      color: 'from-orange-500 to-yellow-500',
    },
    {
      name: 'WalletConnect',
      description: 'Scan QR code with your mobile wallet',
      icon: '📱',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      name: 'Coinbase Wallet',
      description: 'Connect using Coinbase wallet',
      icon: '💙',
      color: 'from-blue-600 to-blue-700',
    },
  ];

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-600/25">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600">
            Connect your wallet to start trading carbon credits
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => handleConnect(wallet.name)}
              disabled={isConnecting}
              className="w-full bg-white border-2 border-gray-200 rounded-2xl p-6 text-left hover:border-green-300 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${wallet.color} flex items-center justify-center text-xl shadow-lg`}
                  >
                    {wallet.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {wallet.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {wallet.description}
                    </p>
                  </div>
                </div>
                {isConnecting ? (
                  <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-1">
                Secure Connection
              </h4>
              <p className="text-sm text-green-700">
                Your wallet connection is encrypted and secure. We never store
                your private keys.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By connecting your wallet, you agree to our Terms of Service and
            Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;