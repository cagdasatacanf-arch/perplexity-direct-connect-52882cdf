
import numpy as np
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("GeminiPatternAnalyzer")

@dataclass
class ConfidenceFactors:
    rsi_slope: float
    volume_ratio: float
    base_confidence: float
    final_confidence: float
    penalties: List[str]

class GeminiPatternAnalyzer:
    """
    v1.1 Pattern Logic Rules:
    1. RSI Slope Check: Penalty -0.2 if slope < 20 degrees (flat/weak momentum)
    2. Volume Gate: Cap confidence at 0.80 if volume < 1.5x average (weak conviction)
    3. Confidence Bounds: Clip final score to [0.0, 1.0]
    """

    @staticmethod
    def calculate_rsi_slope(rsi_values: List[float], lookback: int = 3) -> float:
        """
        Calculate linear regression slope of last N RSI values
        Scaled roughly to degrees for heuristic comparison.
        """
        if len(rsi_values) < lookback:
            return 0.0
        
        y = np.array(rsi_values[-lookback:])
        x = np.arange(len(y))
        
        # Linear regression: slope
        if len(x) > 1:
            slope, _ = np.polyfit(x, y, 1)
            # Simple conversion: 1 unit RSI change per bar ~= 45 degrees heuristic? 
            # The prompt asks for < 20 degrees. 
            # Let's assume the user means a slope value check, 
            # or a specific Angle calculation (degrees = arctan(slope) * 180/PI).
            # Assuming typical chart scaling, let's treat strictly as slope angle.
            angle_degrees = np.degrees(np.arctan(slope))
            return angle_degrees
        return 0.0

    @staticmethod
    def analyze_confidence(base_confidence: float, rsi_series: List[float], 
                           current_volume: float, avg_volume: float) -> ConfidenceFactors:
        
        final_confidence = base_confidence
        penalties = []
        
        # 1. RSI Slope Check
        # User Rule: RSI slope check (-0.2 if < 20 degrees)
        # Note: We check absolute magnitude of momentum or direction? 
        # Usually for trend confirmation we want steep slope. 
        # Assuming "slope" magnitude check.
        rsi_slope = GeminiPatternAnalyzer.calculate_rsi_slope(rsi_series)
        
        if abs(rsi_slope) < 20.0:
            final_confidence -= 0.2
            penalties.append("RSI_SLOPE_LOW")

        # 2. Volume Gate
        # User Rule: Cap 0.80 if < 1.5x
        if avg_volume > 0:
            vol_ratio = current_volume / avg_volume
        else:
            vol_ratio = 0.0 # Safety
            
        if vol_ratio < 1.5:
            # "Cap 0.80" means max possible is 0.80.
            # If current confidence > 0.80, reduce it to 0.80.
            if final_confidence > 0.80:
                final_confidence = 0.80
                penalties.append("VOLUME_GATE_CAP")
        
        # 3. Confidence Bounds
        # User Rule: 0.0-1.0
        final_confidence = max(0.0, min(1.0, final_confidence))
        
        return ConfidenceFactors(
            rsi_slope=rsi_slope,
            volume_ratio=vol_ratio,
            base_confidence=base_confidence,
            final_confidence=round(final_confidence, 2),
            penalties=penalties
        )
