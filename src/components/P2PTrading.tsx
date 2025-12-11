import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Plus, X, Eye, Users, Clock } from "lucide-react";
import CarbonCreditP2P from "../abi/CarbonCreditP2P.json";
import CarbonCredit from "../abi/CarbonCredit.json";

interface P2PTradingProps {
  walletAddress: string;
}

const P2PTrading: React.FC<P2PTradingProps> = ({ walletAddress }) => {
  const [activeTab, setActiveTab] = useState("browse");
  const [orders, setOrders] = useState<any[]>([]);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderData, setOrderData] = useState({ amount: "", price: "" });

  const P2P_ADDRESS = import.meta.env.VITE_CARBONCREDITP2P_ADDRESS!;
  const TOKEN_ADDRESS = import.meta.env.VITE_CARBONCREDIT_ADDRESS!;

  // ===== KẾT NỐI CONTRACT =====
  const getContracts = async () => {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const p2p = new ethers.Contract(P2P_ADDRESS, CarbonCreditP2P.abi, signer);
    const token = new ethers.Contract(TOKEN_ADDRESS, CarbonCredit.abi, signer);
    return { p2p, token, signer };
  };

  // ===== TẠO OFFER MỚI =====
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { p2p, token, signer } = await getContracts();
      const amount = ethers.parseUnits(orderData.amount, 18);
      const pricePerCredit = ethers.parseUnits(orderData.price, "ether");

      // approve trước khi transferFrom
      const allowance = await token.allowance(await signer.getAddress(), P2P_ADDRESS);
      if (allowance < amount) {
        const txApprove = await token.approve(P2P_ADDRESS, amount);
        await txApprove.wait();
      }

      const tx = await p2p.createOffer(amount, pricePerCredit);
      await tx.wait();

      alert("✅ Offer created successfully!");
      setShowCreateOrder(false);
      fetchOffers();
    } catch (err: any) {
      console.error("❌ Create offer error:", err);
      alert(err.message || "Transaction failed");
    }
  };

  // ===== LẤY DANH SÁCH OFFER =====
  const fetchOffers = async () => {
    try {
      const { p2p } = await getContracts();
      const total = await p2p.nextOfferId();
      const temp: any[] = [];
      for (let i = 0; i < Number(total); i++) {
        const offer = await p2p.offers(i);
        if (offer.active) {
          temp.push({
            id: Number(offer.id),
            seller: offer.seller,
            amount: ethers.formatUnits(offer.amount, 18),
            price: ethers.formatEther(offer.pricePerCredit),
          });
        }
      }
      setOrders(temp);
    } catch (err) {
      console.error("Error fetching offers:", err);
    }
  };

  // ===== MUA OFFER =====
  const handleAcceptOffer = async (offer: any) => {
    try {
      const { p2p } = await getContracts();
      const totalPrice = ethers.parseEther(
        (Number(offer.amount) * Number(offer.price)).toString()
      );

      const tx = await p2p.acceptOffer(offer.id, { value: totalPrice });
      await tx.wait();
      console.log(totalPrice);

      alert("✅ Purchase successful!");
      setSelectedOrder(null);
      fetchOffers();
    } catch (err: any) {
      console.error("❌ Accept offer error:", err);
      alert(err.message || "Trade failed");
    }
  };

  // ===== HỦY OFFER =====
  const handleCancelOffer = async (offerId: number) => {
    try {
      const { p2p } = await getContracts();
      const tx = await p2p.cancelOffer(offerId);
      await tx.wait();
      alert("✅ Offer cancelled");
      fetchOffers();
    } catch (err: any) {
      console.error("❌ Cancel offer error:", err);
      alert(err.message || "Cancel failed");
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // ===== GIAO DIỆN =====
  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">🌍 P2P Carbon Credit Trading</h2>
      <p className="text-gray-600">Buy and sell carbon credits directly with SepoliaETH.</p>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl flex space-x-2 border border-green-200">
        {[
          { id: "browse", name: "Browse Orders", icon: Eye },
          { id: "my", name: "My Orders", icon: Users },
          { id: "history", name: "Trade History", icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* BROWSE ORDERS */}
      {activeTab === "browse" && (
        <div>
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold">Available Offers</h3>
            <button
              onClick={() => setShowCreateOrder(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Offer</span>
            </button>
          </div>

          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-gray-500">No active offers yet.</p>
            ) : (
              orders.map((offer) => (
                <div
                  key={offer.id}
                  className="border border-green-100 p-4 rounded-xl flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm text-gray-600">Seller: {offer.seller}</p>
                    <p className="font-semibold">
                      {offer.amount} CCT @ {offer.price} ETH / credit
                    </p>
                  </div>
                  {offer.seller.toLowerCase() !== walletAddress.toLowerCase() ? (
                    <button
                      onClick={() => setSelectedOrder(offer)}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl"
                    >
                      Buy
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCancelOffer(offer.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-xl"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Offer */}
      {showCreateOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create Offer</h3>
              <button onClick={() => setShowCreateOrder(false)}>
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div>
                <label className="text-sm text-gray-700">Amount (CCT)</label>
                <input
                  type="number"
                  value={orderData.amount}
                  onChange={(e) => setOrderData({ ...orderData, amount: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700">Price per Credit (ETH)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={orderData.price}
                  onChange={(e) => setOrderData({ ...orderData, price: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-xl mt-2"
              >
                Create
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Accept Offer */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Confirm Purchase</h3>
              <button onClick={() => setSelectedOrder(null)}>
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">Seller: {selectedOrder.seller}</p>
            <p className="text-gray-800 font-semibold mb-4">
              {selectedOrder.amount} CCT × {selectedOrder.price} ETH ={" "}
              {(Number(selectedOrder.amount) * Number(selectedOrder.price)).toFixed(4)} ETH
            </p>
            <button
              onClick={() => handleAcceptOffer(selectedOrder)}
              className="w-full bg-green-600 text-white py-2 rounded-xl mt-2"
            >
              Confirm Trade
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default P2PTrading;
