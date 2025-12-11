import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';  // STOMP over native WS
import axios from 'axios';

type OrderType = 'buy' | 'sell';

interface Order {
  id: string;
  type: OrderType;
  price: number;
  amount: number;
  total: number;
  userId: string;
  timestamp: number;
  status?: string;
  createdAt?: number;
}

interface Trade {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  creditId: string;
  price: number;
  amount: number;
  totalValue: number;
  txHash: string;
  tradeAt: number;
  buyerId: string;
  sellerId: string;
}

interface OrderBookProps {
  wsUrl?: string;
  apiBase?: string;
  account?: string | null;
}

const OrderBook: React.FC<OrderBookProps> = ({ 
  wsUrl = 'ws://localhost:8080/ws', 
  apiBase = 'http://localhost:8080',
  account = null 
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('buy');
  const [price, setPrice] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [connected, setConnected] = useState<boolean>(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const wsRef = useRef<Client | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);
  const manualCloseRef = useRef<boolean>(false);
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    manualCloseRef.current = false;
    connect();
    return () => {
      manualCloseRef.current = true;
      cleanup();
    };
  }, [wsUrl]);

  const connect = (): void => {
    cleanup();
    console.log('Attempting to connect WS to:', wsUrl);
    try {
      const stompClient = new Client({
        brokerURL: wsUrl,  // Native WS, no SockJS
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (str: string) => console.log('STOMP Debug:', str),
        connectHeaders: { Authorization: `Bearer ${token}` },
        onWebSocketError: (error: Event) => {
          console.error('WebSocket error:', error.type, error.message);
          setWsError('WebSocket error: ' + error.type);
        },
        timeout: 10000
      });

      wsRef.current = stompClient;

      stompClient.onConnect = (frame: any): void => {
        console.log('STOMP connected successfully:', frame.cmd);
        setConnected(true);
        setWsError(null);

        stompClient.subscribe('/topic/orderbook', (message: any) => {
          console.log('Received order:', message.body);
          const data = JSON.parse(message.body);
          handleOrderMessage(data);
        });

        stompClient.subscribe('/topic/trades', (message: any) => {
          console.log('Received trade:', message.body);
          const trade = JSON.parse(message.body) as Trade;
          setTrades((prev) => [...prev, trade]);
        });

        stompClient.publish({
          destination: '/app/snapshot',
          body: JSON.stringify({ type: 'snapshot' })
        });
        console.log('Subscribed and requested snapshot');
      };

      stompClient.onStompError = (frame: any): void => {
        console.error('STOMP error details:', frame.headers, frame.body);
        setWsError('STOMP error: ' + (frame.headers?.message || frame.body || 'Unknown'));
        scheduleReconnect();
      };

      stompClient.activate();  // Activate native WS
    } catch (err: any) {
      console.error('Connect exception:', err);
      setWsError(err.message || 'Failed to connect');
      scheduleReconnect();
    }
  };

  const cleanup = (): void => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.deactivate();
      wsRef.current = null;
    }
  };

  const scheduleReconnect = (): void => {
    if (reconnectRef.current) return;
    reconnectRef.current = setTimeout(() => {
      reconnectRef.current = null;
      connect();
    }, 2000 + Math.random() * 3000);
  };

  const handleOrderMessage = (data: unknown): void => {
    if (!data) return;
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    const type = (parsedData as { type?: string }).type;

    if (type === 'snapshot' && Array.isArray(parsedData.orders)) {
      setOrders(normalizeOrders(parsedData.orders as Partial<Order>[]));
      return;
    }
    if (type === 'update' && (parsedData as { order?: Partial<Order> }).order) {
      const order = (parsedData as { order: Partial<Order> }).order;
      setOrders((prev) => upsertOrder(prev, normalizeOrder(order)));
      return;
    }
    if (type === 'remove' && (parsedData as { id?: string }).id) {
      const id = (parsedData as { id: string }).id;
      setOrders((prev) => prev.filter((o) => o.id !== id));
      return;
    }
    if (Array.isArray(parsedData)) {
      setOrders(normalizeOrders(parsedData as Partial<Order>[]));
      return;
    }
    if ((parsedData as Partial<Order>).id) {
      setOrders((prev) => upsertOrder(prev, normalizeOrder(parsedData as Partial<Order>)));
      return;
    }
    console.debug('Unhandled order message', parsedData);
  };

  const handleCreateOrder = (): void => {
    if (!price || !amount) return;
    const parsedPrice = parseFloat(price);
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedPrice) || isNaN(parsedAmount) || parsedPrice <= 0 || parsedAmount <= 0) return;

    // Tạo temporary id cho optimistic order (tránh duplicate với server id)
    const tempId = `temp-${Date.now()}`;
    const optimisticOrder = createOrderLocal({ 
      type: orderType, 
      price: parsedPrice, 
      amount: parsedAmount,
      id: tempId  // Temp id
    });
    setOrders((prev) => [optimisticOrder, ...prev]);

    // Debug log token để confirm không rỗng
    console.log('Token when placing order:', token ? token.substring(0, 20) + '...' : 'EMPTY TOKEN - CHECK LOGIN!');

    axios.post(`${apiBase}/api/orders/place`, {
      orderType,
      price: parsedPrice,
      amount: parsedAmount,
      creditId: 'CRC001'
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).then((res) => {
      const serverOrder = res.data as Partial<Order>;
      console.log('Order placed success:', serverOrder);  // Debug success

      // Remove temp order, upsert server order (no duplicate)
      setOrders((prev) => {
        let updated = prev.filter((o) => o.id !== tempId);  // Remove temp
        updated = upsertOrder(updated, normalizeOrder(serverOrder));  // Add/replace server
        return updated;
      });
    }).catch((err) => {
      // Remove temp nếu fail
      setOrders((prev) => prev.filter((o) => o.id !== tempId));
      console.error('Place order failed:', err.response?.data || err.message);  // Log backend error
    });

    setPrice('');
    setAmount('');
  };

  const handleCancelOrder = (id: string): void => {
    setOrders((prev) => prev.filter((o) => o.id !== id));

    const stompClient = wsRef.current;
    if (stompClient?.active) {
      stompClient.publish({
        destination: '/app/cancel-order',
        body: JSON.stringify({ id })
      });
    }
  };

  const normalizeOrder = (raw: Partial<Order> & { orderType?: string; address?: string; createdAt?: number }): Order => {
    // ← SỬA: Robust conversion với fallback NaN → 0, force calculate total cho sell/buy
    const safePrice = isNaN(Number(raw.price)) ? 0 : Number(raw.price);
    const safeAmount = isNaN(Number(raw.amount)) ? 0 : Number(raw.amount);
    const rawTotal = Number(raw.total);
    const safeTotal = isNaN(rawTotal) ? (safePrice * safeAmount) : rawTotal;  // Force fallback nếu raw.total NaN

    console.log('Normalize order debug:', { rawPrice: raw.price, safePrice, rawTotal, safeTotal, type: raw.orderType });  // ← THÊM: Debug raw.total cho sell

    return {
      id: raw.id ?? String(Date.now()),
      type: (raw.orderType ?? raw.type ?? '').toLowerCase() === 'sell' ? 'sell' : 'buy',
      price: safePrice,
      amount: safeAmount,
      total: safeTotal,
      userId: raw.userId ?? raw.address ?? '0x0',
      timestamp: Number(raw.timestamp ?? raw.createdAt ?? Date.now()),
      status: raw.status ?? 'OPEN'
    };
  };

  const normalizeOrders = (raws: Partial<Order>[]): Order[] => {
    return raws.map(normalizeOrder);
  };

  const upsertOrder = (prev: Order[], next: Order): Order[] => {
    const idx = prev.findIndex((p) => p.id === next.id);
    if (idx === -1) return [next, ...prev];
    const copy = [...prev];
    copy[idx] = next;
    return copy;
  };

  const createOrderLocal = (o: Partial<Order>): Order => {
    return {
      id: o.id ?? String(Date.now()),
      type: o.type ?? 'buy',
      price: Number(o.price) ?? 0,
      amount: Number(o.amount) ?? 0,
      total: (Number(o.price ?? 0) * Number(o.amount ?? 0)),
      userId: o.userId ?? account ?? '0x0',
      timestamp: o.timestamp ?? Date.now(),
    };
  };

  const buyOrders = useMemo(() => orders.filter((o) => o.type === 'buy').sort((a, b) => b.price - a.price), [orders]);
  const sellOrders = useMemo(() => orders.filter((o) => o.type === 'sell').sort((a, b) => a.price - b.price), [orders]);

  const formatTime = (ts: number): string => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'now';
  };

  const bestBuy = buyOrders[0]?.price ?? 0;
  const bestSell = sellOrders[0]?.price ?? 0;

  // Safe toFixed function (fallback nếu NaN)
  const safeToFixed = (num: number, decimals: number = 2): string => {
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-green-700">📊 OrderBook (Realtime)</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">WS: {connected ? <span className="text-green-600">connected</span> : <span className="text-red-500">disconnected</span>}</div>
          {wsError && <div className="text-red-500 text-sm">{wsError}</div>}
          <button
            className="px-3 py-1 bg-gray-100 rounded border text-sm"
            onClick={() => { manualCloseRef.current = true; cleanup(); setConnected(false); }}
          >
            Disconnect
          </button>
          <button
            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
            onClick={() => { manualCloseRef.current = false; connect(); }}
          >
            Reconnect
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setOrderType('buy')}
                className={`flex-1 py-2 rounded ${orderType === 'buy' ? 'bg-green-100 border border-green-300' : 'bg-gray-50'}`}
              >
                MUA
              </button>
              <button
                onClick={() => setOrderType('sell')}
                className={`flex-1 py-2 rounded ${orderType === 'sell' ? 'bg-red-100 border border-red-300' : 'bg-gray-50'}`}
              >
                BÁN
              </button>
            </div>
            <div className="mb-2">
              <label className="block text-sm text-gray-600">Giá (USD)</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded bg-gray-50"
                placeholder="0.00"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600">Số lượng</label>
              <input
                type="number"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded bg-gray-50"
                placeholder="0"
              />
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600">Tổng</div>
              <div className="font-semibold">${safeToFixed(parseFloat(price || '0') * parseFloat(amount || '0'))}</div>  
            </div>
            <button
              onClick={handleCreateOrder}
              className={`w-full py-2 rounded font-semibold ${orderType === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
            >
              {orderType === 'buy' ? 'Đặt lệnh MUA' : 'Đặt lệnh BÁN'}
            </button>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm text-gray-600">Market</h3>
              <div className="text-sm text-gray-500">Spread: ${safeToFixed(bestSell - bestBuy)}</div>  
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
              <div className="p-2 bg-gray-50 rounded">Best Buy <div className="font-medium">${safeToFixed(bestBuy)}</div></div>
              <div className="p-2 bg-gray-50 rounded">Best Sell <div className="font-medium">${safeToFixed(bestSell)}</div></div>
              <div className="p-2 bg-gray-50 rounded">24h Vol <div className="font-medium">-</div></div>
              <div className="p-2 bg-gray-50 rounded">24h High <div className="font-medium">-</div></div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-green-700">Lệnh MUA ({buyOrders.length})</h3>
              <div className="text-sm text-gray-500">Best: ${safeToFixed(bestBuy)}</div>
            </div>
            <div className="grid grid-cols-4 text-sm font-semibold text-gray-600 border-b pb-2">
              <div>Giá (USD)</div>
              <div>Số lượng</div>
              <div>Tổng</div>
              <div>Thời gian</div>
            </div>
            <div className="max-h-60 overflow-auto mt-2 space-y-2">
              {buyOrders.length === 0 ? (
                <div className="text-center text-gray-400 p-6">Chưa có lệnh mua</div>
              ) : (
                buyOrders.map((o) => (
                  <div key={o.id} className="grid grid-cols-4 items-center bg-green-50 rounded p-2">
                    <div className="font-medium text-green-700">${safeToFixed(o.price)}</div> 
                    <div>{o.amount}</div>
                    <div>${safeToFixed(o.total)}</div>  
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">{formatTime(o.timestamp)}</div>
                      <button
                        onClick={() => handleCancelOrder(o.id)}
                        className="ml-2 text-xs text-red-500"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-red-700">Lệnh BÁN ({sellOrders.length})</h3>
              <div className="text-sm text-gray-500">Best: ${safeToFixed(bestSell)}</div>
            </div>
            <div className="grid grid-cols-4 text-sm font-semibold text-gray-600 border-b pb-2">
              <div>Giá (USD)</div>
              <div>Số lượng</div>
              <div>Tổng</div>
              <div>Thời gian</div>
            </div>
            <div className="max-h-60 overflow-auto mt-2 space-y-2">
              {sellOrders.length === 0 ? (
                <div className="text-center text-gray-400 p-6">Chưa có lệnh bán</div>
              ) : (
                sellOrders.map((o) => (
                  <div key={o.id} className="grid grid-cols-4 items-center bg-red-50 rounded p-2">
                    <div className="font-medium text-red-700">${safeToFixed(o.price)}</div>
                    <div>{o.amount}</div>
                    <div>${safeToFixed(o.total)}</div> 
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">{formatTime(o.timestamp)}</div>
                      <button
                        onClick={() => handleCancelOrder(o.id)}
                        className="ml-2 text-xs text-red-500"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-blue-700">Giao Dịch Gần Đây ({trades.length})</h3>
              <div className="text-sm text-gray-500">Latest: {trades[0]?.tradeAt ? new Date(trades[0].tradeAt).toLocaleTimeString() : '-'}</div>
            </div>
            <div className="grid grid-cols-5 text-sm font-semibold text-gray-600 border-b pb-2">
              <div>Giá</div>
              <div>Số lượng</div>
              <div>Tổng</div>
              <div>Buyer</div>
              <div>Tx</div>
            </div>
            <div className="max-h-40 overflow-auto mt-2 space-y-1">
              {trades.length === 0 ? (
                <div className="text-center text-gray-400 p-4">Chưa có giao dịch</div>
              ) : (
                trades.slice(-10).reverse().map((t) => (
                  <div key={t.id} className="grid grid-cols-5 items-center text-xs border-b py-1">
                    <div>${safeToFixed(t.price)}</div>  
                    <div>{t.amount}</div>
                    <div>${safeToFixed(t.totalValue)}</div> 
                    <div className="truncate">{t.buyerId.slice(0, 6)}...</div>
                    <div>
                      {t.txHash ? (
                        <a href={`https://sepolia.etherscan.io/tx/${t.txHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          {t.txHash.slice(0, 10)}...
                        </a>
                      ) : (
                        'Pending'
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;  // ← EXPORT DEFAULT