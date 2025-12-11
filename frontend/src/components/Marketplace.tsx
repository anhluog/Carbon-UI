import React, { useEffect, useState } from "react";
import {
  ShoppingCart,
  TrendingUp,
  Filter,
  Search,
  MapPin,
  Calendar,
  Award,
  Eye,
  Star,
} from "lucide-react";
import { ethers } from "ethers";
import CarbonCredit from "../abi/CarbonCredit.json";
import CarbonCreditMarketplace from "../abi/CarbonCreditMarketplace.json";

interface MarketplaceProps {
  walletAddress: string;
}

const Marketplace: React.FC<MarketplaceProps> = ({ walletAddress }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [amount, setAmount] = useState<string>("");

  // 🧠 Load danh sách dự án từ contract
  useEffect(() => {
    const loadProjects = async () => {
      try {
        if (!window.ethereum) {
          console.error("MetaMask chưa được cài đặt!");
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          import.meta.env.VITE_CARBONCREDIT_ADDRESS,
          CarbonCredit.abi,
          provider
        );

        console.log("📡 Đang tải danh sách dự án từ blockchain...");
        const result = await contract.getAllProjects();

        const withMetadata = await Promise.all(
          result.map(async (p: any, index: number) => {
            try {
              const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${p.ipfsHash}`;
              console.log(`📦 Dự án #${index + 1}:`, ipfsUrl);

              const res = await fetch(ipfsUrl);
              const metadata = await res.json();

              return {
                
                id: index + 1,
                ipfsUrl,
                totalCredits: p.totalCredits.toString(),
                ...metadata,
              };
            } catch (error) {
              console.error(`❌ Lỗi đọc metadata IPFS cho project ${index + 1}:`, error);
              return null;
            }
          })
        );

        const validProjects = withMetadata.filter((p) => p !== null);
        console.log("✅ Tải thành công:", validProjects);
        setProjects(validProjects);
      } catch (error) {
        console.error("🚨 Lỗi khi tải danh sách dự án:", error);
      }
    };

    loadProjects();
  }, []);

  // 🛒 Khi bấm nút “Buy”
  const handleBuyClick = (project: any) => {
    setSelectedProject(project);
  };
        // 🧾 Xác nhận giao dịch mua token
  const handleConfirmBuy = async () => {
    try {
      if (!amount || parseInt(amount) <= 0) {
        alert("Vui lòng nhập số lượng hợp lệ!");
        return;
      }

      if (!window.ethereum) {
        alert("Vui lòng kết nối ví MetaMask trước!");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        import.meta.env.VITE_MARKETPLACE_ADDRESS,
        CarbonCreditMarketplace.abi,
        signer
      );

      console.log("🔁 Đang gửi giao dịch mua...");
      const tx = await contract.buyTokens(amount);
      await tx.wait();

      alert(`✅ Đã mua ${amount} tín chỉ carbon từ dự án ${selectedProject.projectName}!`);
      setSelectedProject(null);
      setAmount("");
    } catch (error) {
      console.error("❌ Lỗi mua token:", error);
      alert("❌ Giao dịch thất bại.");
    }
  };



  // 🎯 Lọc và sắp xếp
  const filteredProjects = projects.filter((project) => {
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "forest" && project.type === "Forest Protection") ||
      (activeFilter === "renewable" && project.type === "Renewable Energy") ||
      (activeFilter === "afforestation" && project.type === "Afforestation") ||
      (activeFilter === "efficiency" && project.type === "Energy Efficiency");

    const matchesSearch =
      project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.receiver?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-desc":
        return parseFloat(b.price) - parseFloat(a.price);
      default:
        return 0;
    }
  });

  // 🧩 Hiển thị giao diện
  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🌍 Carbon Credits Marketplace
        </h2>
        <p className="text-gray-600">
          Buy and sell verified carbon credits from environmental projects.
        </p>
      </div>

      {/* Search + Filter */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects, locations, or sellers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
          >
            <option value="price">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Grid hiển thị dự án */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedProjects.map((project) => (
          <div
            key={project.id}
            className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-green-100 hover:shadow-xl transition-all duration-300 group"
          >
            <div className="relative">
              <img
                src={project.image}
                alt={project.projectName}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                {project.projectName}
              </h3>
              {/* <p className="text-sm text-gray-600 mb-3">{project.description}</p> */}

              <div className="text-sm text-gray-600 mb-2 flex items-center space-x-2">
                <MapPin className="h-4 w-4" /> <span>{project.location}</span>
                <span className="mx-2">•</span>
                <Calendar className="h-4 w-4" />
                <span>Vintage {project.vintage}</span>
              </div>
{/* 
              <div>
                <span className="text-lg font-semibold text-green-700">
                  Seller: {project.receiver}
                </span> 
              </div>
              
              <div>                 
                <span className="text-lg font-semibold text-green-700">
                  Amount: {project.totalCredits} CCT
                </span> 
              </div> */}

              <div className="flex justify-between items-center mt-4">

                <span className="text-lg font-semibold text-green-700">
                  {project.price} ETH
                </span>
                <button
                  onClick={() => handleBuyClick(project)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Buy</span>
                </button>
              </div>

              {/* 🧾 Popup mua */}
              {selectedProject && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-2xl w-96 shadow-lg">
                    <h3 className="text-xl font-bold mb-2">
                      Buy {selectedProject.projectName}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Price: {selectedProject.price} ETH / Credit
                    </p>
                    <input
                      type="number"
                      placeholder="Enter amount..."
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
                    />
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setSelectedProject(null)}
                        className="px-4 py-2 bg-gray-300 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmBuy}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg"
                      >
                        Confirm Buy
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {project.document && (
                <div className="mt-3">
                  <a
                    href={`https://docs.google.com/gview?url=${project.document}&embedded=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    📄 View project document
                  </a>
                </div>
              )}

            </div>

          </div>
        ))}
      </div>
      
    </div>
  );
};

export default Marketplace;
