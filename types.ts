export interface TrademarkAnalysis {
  name: string;
  score: number;
  timeline: TimelineStep[];
  similarityResults: SimilarityResult[];
  recommendations: string[];
}

export interface TimelineStep {
  phase: string;
  estimatedDuration: number; // in months
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface SimilarityResult {
  name: string;
  similarity: number;
  status: string;
  registrationNumber?: string;
}

export interface INPIResponse {
  marca: string;
  processos: Array<{
    marca: string;
    numero: string;
    situacao: string;
    titular: string;
    tipo: string;
  }>;
  processos_total: number;
  classe?: string;
  ncl?: string;
}