import React from 'react';
import { Clock, CheckCircle, Circle } from 'lucide-react';
import type { TimelineStep } from '../types';

interface Props {
  steps: TimelineStep[];
}

export function Timeline({ steps }: Props) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2" />
        Linha do Tempo Estimada
      </h3>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start">
            <div className="flex flex-col items-center">
              {step.status === 'completed' ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : step.status === 'in-progress' ? (
                <Circle className="w-6 h-6 text-blue-500" />
              ) : (
                <Circle className="w-6 h-6 text-gray-300" />
              )}
              {index < steps.length - 1 && (
                <div className="w-0.5 h-12 bg-gray-200 my-1" />
              )}
            </div>
            <div className="ml-4">
              <h4 className="font-medium">{step.phase}</h4>
              <p className="text-sm text-gray-600">{step.description}</p>
              <p className="text-sm text-gray-500 mt-1">
                Duração estimada: {step.estimatedDuration} meses
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}