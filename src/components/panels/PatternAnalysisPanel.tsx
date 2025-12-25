import { useState } from 'react';
import { PatternAnalysisForm } from '@/components/patterns/PatternAnalysisForm';
import { PatternResults } from '@/components/patterns/PatternResults';
import { PatternRequest, PatternAnalysisResponse } from '@/lib/patternTypes';
import { mockPatternResponses, mockErrorResponse } from '@/lib/mockPatternData';

export const PatternAnalysisPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<PatternAnalysisResponse | null>(null);

  const handleAnalysis = async (request: PatternRequest) => {
    setIsLoading(true);
    setResponse(null);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Use mock data if available, otherwise show "no patterns" response
    const mockData = mockPatternResponses[request.symbol];
    
    if (mockData) {
      // Filter patterns based on selected pattern types
      const filteredPatterns = mockData.data.patterns.filter(p =>
        request.patterns.includes(p.pattern)
      );

      setResponse({
        ...mockData,
        data: {
          ...mockData.data,
          patterns: filteredPatterns,
          summary: {
            ...mockData.data.summary,
            totalPatterns: filteredPatterns.length,
            avgConfidence: filteredPatterns.length > 0
              ? filteredPatterns.reduce((sum, p) => sum + p.confidence, 0) / filteredPatterns.length
              : 0,
          },
        },
      });
    } else {
      // No mock data for this symbol - return empty result
      setResponse({
        success: true,
        data: {
          symbol: request.symbol,
          patterns: [],
          summary: {
            totalPatterns: 0,
            avgConfidence: 0,
            dominantDirection: 'neutral',
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    setIsLoading(false);
  };

  // For testing error handling - uncomment to see error state
  // const handleError = () => {
  //   setResponse(mockErrorResponse);
  // };

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      {/* Input Form */}
      <div>
        <PatternAnalysisForm onSubmit={handleAnalysis} isLoading={isLoading} />
      </div>

      {/* Results Display */}
      <div>
        <PatternResults response={response} isLoading={isLoading} />
      </div>
    </div>
  );
};
