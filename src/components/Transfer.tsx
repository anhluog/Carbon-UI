import React, { useState } from 'react';
import { Send, Users, Clock, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { ethers } from 'ethers';
import CarbonCreditToken from '../abi/CarbonCredit.json';
import axios from 'axios';
import { error } from 'console';

interface TransferProps {
  walletAddress: string;
}

const Transfer: React.FC<TransferProps> = ({ walletAddress }) => {
  const [transferData, setTransferData] = useState({
    recipient: '',
    amount: '',
    note: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const recentContacts = [
    {
      name: 'Green Energy Corp',
      address: '0x742d35Cc6644C022532532532',
      lastTransaction: '2 days ago'
    },
    {
      name: 'Carbon Offset Ltd',
      address: '0x8a4b2c5d7e9f1234567890ab',
      lastTransaction: '1 week ago'
    },
    {
      name: 'Eco Solutions Inc',
      address: '0x1234567890abcdef12345678',
      lastTransaction: '2 weeks ago'
    }
  ];

  const recentTransactions = [
    {
      type: 'sent',
      amount: '25.5 CCT',
      recipient: '0x742d35...532',
      time: '2 hours ago',
      status: 'completed'
    },
    {
      type: 'received',
      amount: '50.0 CCT',
      sender: '0x8a4b2c...90ab',
      time: '1 day ago',
      status: 'completed'
    },
    {
      type: 'sent',
      amount: '15.0 CCT',
      recipient: '0x1234567...5678',
      time: '3 days ago',
      status: 'completed'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTransferData({
      ...transferData,
      [e.target.name]: e.target.value
    });
  };

  const handleContactSelect = (address: string) => {
    setTransferData({
      ...transferData,
      recipient: address
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try{
      if (!(window as any).ethereum) throw new Error('MetaMask not detected');
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        import.meta.env.VITE_CARBONCREDIT_ADDRESS!,
        
        CarbonCreditToken.abi,
        signer
      );

      const amount = ethers.parseUnits(transferData.amount);
      const tx = await contract.transferCredit(
        transferData.recipient,
        ethers.parseUnits(transferData.amount, 18),
      );
      const receipt = await tx.wait();

      setIsSubmitting(false);
      setShowSuccess(true);



    }catch (err: any) {
      console.error('Mint failed:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }

    
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-green-200 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Transfer Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your carbon credit tokens have been transferred successfully.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-800 font-medium">
              {transferData.amount} CCT sent to {transferData.recipient.slice(0, 6)}...{transferData.recipient.slice(-4)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Transfer Carbon Credits</h2>
        <p className="text-gray-600">Send carbon credit tokens to other wallet addresses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transfer Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Address *
                </label>
                <input
                  type="text"
                  name="recipient"
                  value={transferData.recipient}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="0x742d35Cc6644C022532532532..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (CCT) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="amount"
                    value={transferData.amount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    placeholder="0.00"
                    min="0.001"
                    step="0.001"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 hover:text-green-700 text-sm font-medium"
                    onClick={() => setTransferData({...transferData, amount: '1250.45'})}
                  >
                    Max
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Available balance: 1,250.45 CCT
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (Optional)
                </label>
                <textarea
                  name="note"
                  value={transferData.note}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                  placeholder="Add a note for this transfer..."
                />
              </div>

              {/* Transfer Summary */}
              {transferData.amount && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h4 className="font-medium text-green-900 mb-3">Transfer Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Amount:</span>
                      <span className="font-medium text-green-900">{transferData.amount} CCT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Value:</span>
                      <span className="font-medium text-green-900">
                        ${(parseFloat(transferData.amount) * 2.31).toFixed(2)} USD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Gas Fee:</span>
                      <span className="font-medium text-green-900">0.0012 ETH (~$2.30)</span>
                    </div>
                    <hr className="border-green-200" />
                    <div className="flex justify-between font-medium">
                      <span className="text-green-800">Total Cost:</span>
                      <span className="text-green-900">
                        ${(parseFloat(transferData.amount) * 2.31 + 2.30).toFixed(2)} USD
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !transferData.recipient || !transferData.amount}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Send Transfer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Contacts */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Recent Contacts</span>
            </h3>
            <div className="space-y-3">
              {recentContacts.map((contact, index) => (
                <div
                  key={index}
                  onClick={() => handleContactSelect(contact.address)}
                  className="p-3 bg-gray-50 rounded-xl hover:bg-green-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 text-sm">{contact.name}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(contact.address);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    {contact.address.slice(0, 10)}...{contact.address.slice(-6)}
                  </p>
                  <p className="text-xs text-green-600">{contact.lastTransaction}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activity</span>
            </h3>
            <div className="space-y-3">
              {recentTransactions.map((tx, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      {tx.type === 'sent' ? (
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                          <Send className="h-3 w-3 text-red-600" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <Send className="h-3 w-3 text-green-600 transform rotate-180" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 capitalize">{tx.type}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{tx.amount}</span>
                  </div>
                  <div className="ml-8">
                    <p className="text-xs text-gray-600">
                      {tx.type === 'sent' ? `To: ${tx.recipient}` : `From: ${tx.sender}`}
                    </p>
                    <p className="text-xs text-gray-500">{tx.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;