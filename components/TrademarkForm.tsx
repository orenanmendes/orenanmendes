import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface Props {
  onAnalyze: (name: string) => void;
  isLoading: boolean;
}

export function TrademarkForm({ onAnalyze, isLoading }: Props) {
  const [trademarkName, setTrademarkName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trademarkName.trim()) {
      onAnalyze(trademarkName.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={trademarkName}
          onChange={(e) => setTrademarkName(e.target.value)}
          placeholder="Digite o nome da marca"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !trademarkName.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}