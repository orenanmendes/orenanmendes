import React, { useState } from 'react';
import { TrademarkForm } from './components/TrademarkForm';
import { ViabilityScore } from './components/ViabilityScore';
import { Timeline } from './components/Timeline';
import { SimilarityResults } from './components/SimilarityResults';
import { AlertOctagon, Info } from 'lucide-react';
import type { TrademarkAnalysis } from './types';
import { searchTrademark, calculateViabilityScore } from './services/inpi';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<TrademarkAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const inpiData = await searchTrademark(name);
      const result = calculateViabilityScore(inpiData);
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing trademark:', error);
      setError('Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Análise de Viabilidade de Marca
          </h1>
          <p className="text-gray-600">
            Verifique a viabilidade de registro da sua marca no INPI
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <Info className="w-5 h-5 text-blue-500 mr-2" />
            <p className="text-blue-700">
              Esta é uma versão de demonstração. Para uma análise oficial, visite o{' '}
              <a
                href="https://busca.inpi.gov.br"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-800"
              >
                site do INPI
              </a>
              .
            </p>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <TrademarkForm onAnalyze={handleAnalyze} isLoading={isLoading} />
        </div>

        {error && (
          <div className="flex items-center justify-center p-4 mb-8 bg-red-50 border border-red-200 rounded-lg">
            <AlertOctagon className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {analysis && !isLoading && (
          <div className="space-y-6">
            <ViabilityScore score={analysis.score} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Timeline steps={analysis.timeline} />
              <SimilarityResults results={analysis.similarityResults} />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Recomendações</h3>
              <ul className="list-disc list-inside space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="text-gray-700">{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;