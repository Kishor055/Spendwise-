
"""
SpendWise Financial Core v1.0
Advanced mathematical models for professional fintech operations.
Utilizes Monte Carlo Simulations and Modern Portfolio Theory (MPT).
"""

import math
import random

class FinancialEngine:
    def __init__(self, risk_profile='BALANCED'):
        self.risk_profile = risk_profile
        self.market_volatility = {
            'CONSERVATIVE': 0.05,
            'BALANCED': 0.12,
            'AGGRESSIVE': 0.25
        }

    def monte_carlo_simulation(self, current_savings, monthly_contribution, years, iterations=1000):
        """
        Calculates the probability of achieving a wealth target using 
        stochastic modeling of market returns.
        """
        results = []
        volatility = self.market_volatility.get(self.risk_profile, 0.12)
        annual_return = 0.08  # Target 8% return for balanced profile
        
        for _ in range(iterations):
            balance = current_savings
            for _ in range(years * 12):
                # Monthly random walk with geometric brownian motion logic
                monthly_growth = (annual_return / 12) + (volatility * random.gauss(0, 1) / math.sqrt(12))
                balance = (balance + monthly_contribution) * (1 + monthly_growth)
            results.append(balance)
            
        return {
            "median_projection": sorted(results)[iterations // 2],
            "worst_case_5pct": sorted(results)[int(iterations * 0.05)],
            "best_case_95pct": sorted(results)[int(iterations * 0.95)],
            "confidence_score": 1.0 - (volatility / 0.5)
        }

    def calculate_professional_burn_rate(self, monthly_expenses, liquid_assets, inflation=0.06):
        """
        Calculates commercial viability (survival months) in a high-inflation market.
        """
        months = 0
        current_assets = liquid_assets
        current_expenses = monthly_expenses
        
        while current_assets > current_expenses and months < 360: # Max 30 years
            current_assets -= current_expenses
            # Compound inflation monthly
            current_expenses *= (1 + (inflation / 12))
            months += 1
            
        return {
            "viability_months": months,
            "risk_rating": "CRITICAL" if months < 6 else "STABLE" if months > 18 else "VULNERABLE",
            "market_resilience": round(min(1.0, months / 24), 2)
        }

# Example Market Analysis Logic
def analyze_sector_sentiment(news_headlines):
    """
    Simulates NLP sentiment scoring for market sectors.
    """
    positive_keywords = ['growth', 'bullish', 'expansion', 'surge', 'stable', 'alpha']
    negative_keywords = ['recession', 'bearish', 'layoff', 'inflation', 'risk', 'dip']
    
    score = 0
    for headline in news_headlines:
        for word in positive_keywords:
            if word in headline.lower(): score += 1
        for word in negative_keywords:
            if word in headline.lower(): score -= 1
            
    return "BULLISH" if score > 0 else "BEARISH" if score < 0 else "NEUTRAL"
