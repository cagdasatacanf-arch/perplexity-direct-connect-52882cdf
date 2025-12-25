import json
import numpy as np

class GeminiPatternAnalyzer:
    """
    v1.1 Pattern Analyzer
    Implements strict rule-based validation for market patterns:
    1. Volume Gate: Rejects high confidence if vol < 1.5x avg
    2. RSI Slope: Penalizes shallow divergence
    3. Bounds: Clamps confidence 0.0-1.0
    """

    def __init__(self):
        pass

    def calculate_rsi_slope(self, rsi_values):
        """
        Calculates the slope of the last 3 RSI peaks/values in degrees.
        Simple linear regression on last 3 points.
        """
        if len(rsi_values) < 3:
            return 0.0
        
        y = np.array(rsi_values[-3:])
        x = np.array([0, 1, 2])
        A = np.vstack([x, np.ones(len(x))]).T
        m, c = np.linalg.lstsq(A, y, rcond=None)[0]
        
        # Convert slope to degrees (arctan)
        # Note: This is an approximation as x-axis is unit steps
        angle_rad = np.arctan(m)
        angle_deg = np.degrees(angle_rad)
        return angle_deg

    def validate_analysis(self, analysis_result, market_data):
        """
        Applies v1.1 rules to a raw analysis result.
        Returns the modified analysis object.
        """
        
        # Extract metrics
        # Assuming market_data is a list of dicts with 'volume', 'rsi' keys
        # and checking the LAST candle for current volume
        current_volume = market_data[-1].get('volume', 0)
        volumes = [d.get('volume', 0) for d in market_data]
        if len(volumes) >= 20:
            avg_volume_20 = np.mean(volumes[-20:])
        else:
            avg_volume_20 = np.mean(volumes) if volumes else 1

        volume_multiplier = current_volume / avg_volume_20 if avg_volume_20 > 0 else 0

        # Extract RSI
        rsi_values = [d.get('rsi', 50) for d in market_data]
        rsi_slope = self.calculate_rsi_slope(rsi_values)

        # Iterate through patterns identified
        validated_patterns = []
        for pattern in analysis_result:
            confidence = pattern.get('confidence', 0.0)
            pattern_name = pattern.get('pattern_name', 'Unknown')
            
            # --- RULE 1: VOLUME GATE ---
            # If (current_volume / avg_volume_20) < 1.5, confidence CANNOT be > 0.80
            volume_gate_passed = True
            if volume_multiplier < 1.5:
                volume_gate_passed = False
                if confidence > 0.80:
                    print(f"Volume Gate Triggered for {pattern_name}: Conf {confidence} -> 0.80")
                    confidence = 0.80
            
            # --- RULE 2: RSI SLOPE CHECK ---
            # For RSI Divergence, if slope < 20 deg, subtract 0.2
            slope_gate_passed = True
            if "RSI" in pattern_name.upper() or "DIVERGENCE" in pattern_name.upper():
                if abs(rsi_slope) < 20:
                    slope_gate_passed = False
                    print(f"RSI Slope Triggered for {pattern_name}: Slope {rsi_slope:.2f} < 20. Penalty -0.2 applied.")
                    confidence -= 0.2

            # --- RULE 3: BOUNDS ---
            confidence = max(0.0, min(1.0, confidence))
            confidence = round(confidence, 2)

            # Update Metadata
            pattern['confidence'] = confidence
            pattern['logic_check'] = {
                "volume_multiplier": round(volume_multiplier, 2),
                "rsi_slope_deg": round(rsi_slope, 2),
                "gates_passed": {
                    "volume_gate": volume_gate_passed,
                    "slope_gate": slope_gate_passed
                }
            }
            validated_patterns.append(pattern)

        return validated_patterns

# --- Unit Tests ---
def run_tests():
    analyzer = GeminiPatternAnalyzer()
    
    # Test Case 1: Low Volume, High Confidence (Should be capped)
    mock_data_1 = [{'volume': 100, 'rsi': 50}] * 19 + [{'volume': 100, 'rsi': 55}] # Vol mult ~1.0
    mock_result_1 = [{'pattern_name': 'Test Surge', 'confidence': 0.95}]
    
    res1 = analyzer.validate_analysis(mock_result_1, mock_data_1)
    assert res1[0]['confidence'] == 0.80, f"Test 1 Failed: {res1[0]['confidence']}"
    print("Test 1 Passed: Volume Gate")

    # Test Case 2: RSI Divergence, Low Slope (Should be penalized)
    # RSI: 50, 51, 52 (Slope ~ 1.0, Angle ~ 45 deg) -> Wait, 50->51->52 is linear (+1). atan(1) = 45 deg.
    # Let's try shallow: 50, 50.1, 50.2 (Slope 0.1). atan(0.1) ~= 5.7 deg
    mock_data_2 = [{'volume': 200, 'rsi': 50 + (i*0.01)}] * 20 # High volume
    mock_result_2 = [{'pattern_name': 'RSI Divergence', 'confidence': 0.90}]
    
    # Manually overwrite RSI to specific last 3 values for clarity in test
    # This mock data setup was a bit simplistic, logic uses last 3.
    # Let's ensure last 3 are shallow.
    mock_data_2[-3]['rsi'] = 50.0
    mock_data_2[-2]['rsi'] = 50.1
    mock_data_2[-1]['rsi'] = 50.2
    
    res2 = analyzer.validate_analysis(mock_result_2, mock_data_2)
    # Expected: 0.90 (vol pass) - 0.20 (slope fail) = 0.70
    assert res2[0]['confidence'] == 0.70, f"Test 2 Failed: {res2[0]['confidence']}"
    print("Test 2 Passed: RSI Slope Penalty")

    # Test Case 3: Bounds Check
    mock_result_3 = [{'pattern_name': 'Crazy Pattern', 'confidence': 1.5}]
    res3 = analyzer.validate_analysis(mock_result_3, mock_data_1) # Low vol -> cap 0.80
    assert res3[0]['confidence'] == 0.80, f"Test 3 Failed: {res3[0]['confidence']}"
    print("Test 3 Passed: Upper Bound + Vol Gate")

if __name__ == "__main__":
    run_tests()
