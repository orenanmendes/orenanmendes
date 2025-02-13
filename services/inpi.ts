import type { TrademarkAnalysis, INPIResponse } from '../types';

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

export async function searchTrademark(name: string): Promise<INPIResponse> {
  try {
    if (!name.trim()) {
      throw new Error('Nome da marca não pode estar vazio');
    }

    const response = await fetch(`${API_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ marca: name }),
    });

    if (!response.ok) {
      throw new Error('Erro na consulta ao servidor');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar marca:', error);
    throw error instanceof Error ? error : new Error('Erro desconhecido ao buscar marca');
  }
}

export function calculateViabilityScore(inpiData: INPIResponse): TrademarkAnalysis {
  const similarMarks = inpiData.processos || [];
  
  const similarityResults = similarMarks.map(process => ({
    name: process.marca,
    similarity: calculateStringSimilarity(process.marca, inpiData.marca),
    status: process.situacao,
    registrationNumber: process.numero
  }));

  const score = calculateOverallScore(similarityResults);
  const recommendations = generateRecommendations(score, similarityResults, inpiData.ncl);

  return {
    name: inpiData.marca,
    score,
    timeline: generateTimeline(score, similarityResults),
    similarityResults,
    recommendations
  };
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const a = str1.toLowerCase();
  const b = str2.toLowerCase();
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + substitutionCost
      );
    }
  }

  const maxLength = Math.max(a.length, b.length);
  const distance = matrix[b.length][a.length];
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  return Math.round(similarity);
}

function calculateOverallScore(similarityResults: Array<{ similarity: number; status: string }>): number {
  if (similarityResults.length === 0) return 90;
  
  const activeRegistrations = similarityResults.filter(
    r => r.status === 'Registro vigente' || r.status === 'Em exame de mérito'
  );
  
  if (activeRegistrations.length === 0) return 85;
  
  const highestSimilarity = Math.max(...activeRegistrations.map(r => r.similarity));
  return Math.max(0, Math.round(100 - highestSimilarity));
}

function generateRecommendations(
  score: number,
  similarityResults: Array<{ similarity: number; name: string; status: string }>,
  ncl?: string
): string[] {
  const recommendations: string[] = [];

  if (ncl) {
    recommendations.push(`Sua marca está sendo analisada para a classe NCL ${ncl}`);
  }

  if (score < 40) {
    recommendations.push('Alta probabilidade de indeferimento devido a marcas similares existentes');
    recommendations.push('Considere modificar significativamente o nome da marca');
    recommendations.push('Recomendamos consulta com especialista em propriedade intelectual');
  } else if (score < 70) {
    recommendations.push('Existem algumas marcas similares que podem gerar oposição');
    recommendations.push('Prepare documentação comprobatória de distintividade');
    recommendations.push('Considere realizar busca prévia detalhada');
  } else {
    recommendations.push('Boa chance de aprovação');
    recommendations.push('Recomendamos prosseguir com o pedido de registro');
  }

  const activeRegistrations = similarityResults.filter(
    r => r.status === 'Registro vigente' && r.similarity > 60
  );
  
  if (activeRegistrations.length > 0) {
    recommendations.push('Atenção: Existem marcas registradas com alto grau de similaridade');
  }

  return recommendations;
}

function generateTimeline(
  score: number,
  similarityResults: Array<{ status: string }>
) {
  const hasActiveOppositions = similarityResults.some(
    r => r.status === 'Aguardando análise de oposição'
  );

  return [
    {
      phase: 'Depósito do Pedido',
      estimatedDuration: 1,
      description: 'Submissão inicial do pedido de registro',
      status: 'pending' as const
    },
    {
      phase: 'Exame Formal',
      estimatedDuration: 2,
      description: 'Verificação dos requisitos formais',
      status: 'pending' as const
    },
    {
      phase: 'Publicação',
      estimatedDuration: hasActiveOppositions ? 4 : 2,
      description: 'Publicação para oposição de terceiros',
      status: 'pending' as const
    },
    {
      phase: 'Exame Substantivo',
      estimatedDuration: score < 70 ? 18 : 12,
      description: 'Análise técnica do pedido',
      status: 'pending' as const
    },
    {
      phase: 'Decisão',
      estimatedDuration: 1,
      description: 'Decisão final sobre o registro',
      status: 'pending' as const
    }
  ];
}