import React, { useState } from 'react';
import { Droplets, TrendingUp, Plus, Minus, ArrowUpDown, BarChart3, DollarSign, Percent, Info, Zap } from 'lucide-react';

interface AMMTradingProps {
  walletAddress: string;
}

const AMMTrading: React.FC<AMMTradingProps> = ({ walletAddress }) => {
  const [activeTab, setActiveTab] = useState('swap');
  const [swapData, setSwapData] = useState({
    fromToken: 'ETH',
    toToken: 'CCT',
    fromAmount: '',
    toAmount: '',
    slippage: '0.5'
  });
  const [liquidityData, setLiquidityData] = useState({
    token1: 'ETH',
    token2: 'CCT',
    amount1: '',
    amount2: ''
  });

  const liquidityPools = [
    {
      id: 1,
      pair: 'CCT/ETH',
      token1: 'CCT',
      token2: 'ETH',
      tvl: '$2,450,000',
      volume24h: '$125,000',
      fees24h: '$375',
      apr: '12.5%',
      myLiquidity: '$5,250',
      myShare: '0.21%',
      token1Reserve: '1,250,000',
      token2Reserve: '1,020',
      price: '0.000816 ETH',
      priceChange: '+2.3%'
    },
    {
      id: 2,
      pair: 'CCT/USDC',
      token1: 'CCT',
      token2: 'USDC',
      tvl: '$1,850,000',
      volume24h: '$89,000',
      fees24h: '$267',
      apr: '15.2%',
      myLiquidity: '$0',
      myShare: '0%',
      token1Reserve: '850,000',
      token2Reserve: '1,950,000',
      price: '2.29 USDC',
      priceChange: '+1.8%'
    },
    {
      id: 3,
      pair: 'CCT/WBTC',
      token1: 'CCT',
      token2: 'WBTC',
      tvl: '$980,000',
      volume24h: '$45,000',
      fees24h: '$135',
      apr: '18.7%',
      myLiquidity: '$0',
      myShare: '0%',
      token1Reserve: '450,000',
      token2Reserve: '22.5',
      price: '0.00005 WBTC',
      priceChange: '-0.5%'
    }
  ];

  const myPositions = [
    {
      pair: 'CCT/ETH',
      liquidity: '$5,250',
      token1Amount: '2,500 CCT',
      token2Amount: '2.04 ETH',
      share: '0.21%',
      fees: '$12.50',
      apr: '12.5%'
    }
  ];

  const recentTransactions = [
    {
      type: 'swap',
      action: 'Swapped 1.5 ETH for 1,837 CCT',
      time: '2 hours ago',
      hash: '0x1234...5678'
    },
    {
      type: 'add',
      action: 'Added liquidity to CCT/ETH pool',
      time: '1 day ago',
      hash: '0x8765...4321'
    },
    {
      type: 'remove',
      action: 'Removed liquidity from CCT/USDC pool',
      time: '3 days ago',
      hash: '0x9876...1234'
    }
  ];

  const handleSwap = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle swap logic
  };

  const handleAddLiquidity = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle add liquidity logic
  };

  const calculateSwapOutput = (inputAmount: string, fromToken: string, toToken: string) => {
    if (!inputAmount) return '';
    // Simplified calculation - in real app, this would use actual pool reserves
    const rate = fromToken === 'ETH' ? 1837 : 0.000544;
    return (parseFloat(inputAmount) * rate).toFixed(6);
  };

  const renderSwap = () => (
    <div className="max-w-md mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Swap Tokens</h3>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <BarChart3 className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSwap} className="space-y-4">
          {/* From Token */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">From</label>
              <span className="text-sm text-gray-500">Balance: 5.24 ETH</span>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={swapData.fromToken}
                onChange={(e) => setSwapData({...swapData, fromToken: e.target.value})}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium"
              >
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
                <option value="WBTC">WBTC</option>
              </select>
              <input
                type="number"
                value={swapData.fromAmount}
                onChange={(e) => {
                  const newAmount = e.target.value;
                  setSwapData({
                    ...swapData,
                    fromAmount: newAmount,
                    toAmount: calculateSwapOutput(newAmount, swapData.fromToken, swapData.toToken)
                  });
                }}
                className="flex-1 bg-transparent text-right text-xl font-semibold text-gray-900 placeholder-gray-400 focus:outline-none"
                placeholder="0.0"
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                setSwapData({
                  ...swapData,
                  fromToken: swapData.toToken,
                  toToken: swapData.fromToken,
                  fromAmount: swapData.toAmount,
                  toAmount: swapData.fromAmount
                });
              }}
              className="bg-green-100 hover:bg-green-200 p-3 rounded-xl transition-colors"
            >
              <ArrowUpDown className="h-5 w-5 text-green-600" />
            </button>
          </div>

          {/* To Token */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">To</label>
              <span className="text-sm text-gray-500">Balance: 1,250.45 CCT</span>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={swapData.toToken}
                onChange={(e) => setSwapData({...swapData, toToken: e.target.value})}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium"
              >
                <option value="CCT">CCT</option>
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
              </select>
              <input
                type="number"
                value={swapData.toAmount}
                readOnly
                className="flex-1 bg-transparent text-right text-xl font-semibold text-gray-900 focus:outline-none"
                placeholder="0.0"
              />
            </div>
          </div>

          {/* Swap Details */}
          {swapData.fromAmount && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Rate:</span>
                  <span className="font-medium text-blue-900">1 ETH = 1,837 CCT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Price Impact:</span>
                  <span className="font-medium text-blue-900">0.12%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Slippage Tolerance:</span>
                  <span className="font-medium text-blue-900">{swapData.slippage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Network Fee:</span>
                  <span className="font-medium text-blue-900">~$8.50</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!swapData.fromAmount}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {swapData.fromAmount ? 'Swap Tokens' : 'Enter Amount'}
          </button>
        </form>
      </div>
    </div>
  );

  const renderLiquidity = () => (
    <div className="space-y-8">
      {/* Add Liquidity Form */}
      <div className="max-w-md mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Add Liquidity</h3>

          <form onSubmit={handleAddLiquidity} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Token 1</label>
                <select
                  value={liquidityData.token1}
                  onChange={(e) => setLiquidityData({...liquidityData, token1: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium mb-2"
                >
                  <option value="CCT">CCT</option>
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                </select>
                <input
                  type="number"
                  value={liquidityData.amount1}
                  onChange={(e) => setLiquidityData({...liquidityData, amount1: e.target.value})}
                  className="w-full bg-transparent text-lg font-semibold text-gray-900 placeholder-gray-400 focus:outline-none"
                  placeholder="0.0"
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Token 2</label>
                <select
                  value={liquidityData.token2}
                  onChange={(e) => setLiquidityData({...liquidityData, token2: e.target.value})}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium mb-2"
                >
                  <option value="ETH">ETH</option>
                  <option value="CCT">CCT</option>
                  <option value="USDC">USDC</option>
                </select>
                <input
                  type="number"
                  value={liquidityData.amount2}
                  onChange={(e) => setLiquidityData({...liquidityData, amount2: e.target.value})}
                  className="w-full bg-transparent text-lg font-semibold text-gray-900 placeholder-gray-400 focus:outline-none"
                  placeholder="0.0"
                />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Pool Information</span>
              </div>
              <div className="space-y-1 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>Current Rate:</span>
                  <span>1 CCT = 0.000544 ETH</span>
                </div>
                <div className="flex justify-between">
                  <span>Pool Share:</span>
                  <span>0.15%</span>
                </div>
                <div className="flex justify-between">
                  <span>LP Tokens:</span>
                  <span>125.45 CCT-ETH</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
            >
              Add Liquidity
            </button>
          </form>
        </div>
      </div>

      {/* My Positions */}
      {myPositions.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">My Liquidity Positions</h3>
          <div className="grid gap-4">
            {myPositions.map((position, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">{position.pair}</h4>
                    <p className="text-sm text-gray-600">Pool Share: {position.share}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{position.liquidity}</p>
                    <p className="text-sm text-green-600">APR: {position.apr}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Pooled Tokens</p>
                    <p className="font-medium text-gray-900">{position.token1Amount}</p>
                    <p className="font-medium text-gray-900">{position.token2Amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fees Earned</p>
                    <p className="font-medium text-green-600">{position.fees}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                    <Minus className="h-4 w-4" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderPools = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Liquidity Pools</h3>
        <div className="flex items-center space-x-4">
          <select className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500">
            <option>All Pools</option>
            <option>My Pools</option>
            <option>High APR</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6">
        {liquidityPools.map((pool) => (
          <div key={pool.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100 hover:shadow-lg transition-all duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{pool.pair}</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{pool.price}</span>
                  <span className={`font-medium ${
                    pool.priceChange.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {pool.priceChange}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  APR {pool.apr}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">TVL</p>
                <p className="font-semibold text-gray-900">{pool.tvl}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">24h Volume</p>
                <p className="font-semibold text-gray-900">{pool.volume24h}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">24h Fees</p>
                <p className="font-semibold text-gray-900">{pool.fees24h}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">My Liquidity</p>
                <p className="font-semibold text-gray-900">{pool.myLiquidity}</p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <span>{pool.token1Reserve} {pool.token1} • {pool.token2Reserve} {pool.token2}</span>
              </div>
              <div className="flex space-x-2">
                <button className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium">
                  View
                </button>
                <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 text-sm">
                  Add Liquidity
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Analytics & History</h3>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-8 w-8 text-green-600" />
            <span className="text-sm text-green-600 font-medium">+12.5%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">$5,250</h3>
          <p className="text-sm text-gray-600">Total Liquidity Value</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <Percent className="h-8 w-8 text-blue-600" />
            <span className="text-sm text-blue-600 font-medium">24h</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">$12.50</h3>
          <p className="text-sm text-gray-600">Fees Earned</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <Zap className="h-8 w-8 text-purple-600" />
            <span className="text-sm text-purple-600 font-medium">7d</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">15</h3>
          <p className="text-sm text-gray-600">Total Transactions</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h4>
        <div className="space-y-4">
          {recentTransactions.map((tx, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  tx.type === 'swap' ? 'bg-blue-100 text-blue-600' :
                  tx.type === 'add' ? 'bg-green-100 text-green-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {tx.type === 'swap' ? <ArrowUpDown className="h-5 w-5" /> :
                   tx.type === 'add' ? <Plus className="h-5 w-5" /> :
                   <Minus className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{tx.action}</p>
                  <p className="text-sm text-gray-500">{tx.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 font-mono">{tx.hash}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'swap', name: 'Swap', icon: ArrowUpDown },
    { id: 'liquidity', name: 'Liquidity', icon: Plus },
    { id: 'pools', name: 'Pools', icon: Droplets },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 }
  ];

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">AMM Trading</h2>
        <p className="text-gray-600">Trade and provide liquidity through automated market maker pools.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 border border-green-200">
        <div className="flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/20'
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium text-sm">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'swap' && renderSwap()}
      {activeTab === 'liquidity' && renderLiquidity()}
      {activeTab === 'pools' && renderPools()}
      {activeTab === 'analytics' && renderAnalytics()}
    </div>
  );
};

export default AMMTrading;