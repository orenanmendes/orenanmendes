import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  score: number;
}

export function ViabilityScore({ score }: Props) {
  const getScoreColor = () => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreIcon = () => {
    if (score >= 70) return <CheckCircle className="w-8 h-8" />;
    if (score >= 40) return <AlertCircle className="w-8 h-8" />;
    return <XCircle className="w-8 h-8" />;
  };

  return (
    <div className="flex items-center space-x-4 p-6 bg-white rounded-lg shadow-md">
      <div className={getScoreColor()}>{getScoreIcon()}</div>
      <div>
        <h3 className="text-lg font-semibold">Score de Viabilidade</h3>
        <div className="flex items-center space-x-2">
          <div className={`text-3xl font-bold ${getScoreColor()}`}>
            {score}%
          </div>
          <div className="text-gray-500">
            {score >= 70
              ? 'Alta chance de aprovação'
              : score >= 40
              ? 'Análise necessária'
              : 'Baixa chance de aprovação'}
          </div>
        </div>
      </div>
    </div>
  );
}