import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { SimilarityResult } from '../types';

interface Props {
  results: SimilarityResult[];
}

export function SimilarityResults({ results }: Props) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2" />
        Marcas Similares Encontradas
      </h3>
      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{result.name}</h4>
                <p className="text-sm text-gray-600">
                  Processo: {result.registrationNumber || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Status: {result.status}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium">
                  Similaridade:
                  <span
                    className={
                      result.similarity > 70
                        ? 'text-red-500'
                        : result.similarity > 40
                        ? 'text-yellow-500'
                        : 'text-green-500'
                    }
                  >
                    {' '}
                    {result.similarity}%
                  </span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}