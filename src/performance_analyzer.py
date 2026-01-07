"""
Performance analysis module - Analyzes campaign performance and generates insights
"""

from datetime import datetime

class PerformanceAnalyzer:
    """Analyzes Google Ads performance data"""

    def __init__(self, config, logger):
        self.config = config
        self.logger = logger

    def analyze_campaign_performance(self, campaign):
        """
        Analyze overall campaign performance

        Returns: dict with performance metrics and insights
        """
        impressions = campaign.get('impressions', 0)
        clicks = campaign.get('clicks', 0)
        cost = campaign.get('cost', 0)
        conversions = campaign.get('conversions', 0)
        conversion_value = campaign.get('conversion_value', 0)

        # Calculate key metrics
        ctr = (clicks / impressions * 100) if impressions > 0 else 0
        avg_cpc = (cost / clicks) if clicks > 0 else 0
        conversion_rate = (conversions / clicks * 100) if clicks > 0 else 0
        cost_per_conversion = (cost / conversions) if conversions > 0 else 0
        roas = (conversion_value / cost) if cost > 0 else 0

        analysis = {
            'campaign_id': campaign['id'],
            'campaign_name': campaign['name'],
            'metrics': {
                'impressions': impressions,
                'clicks': clicks,
                'ctr': round(ctr, 2),
                'cost': round(cost, 2),
                'avg_cpc': round(avg_cpc, 2),
                'conversions': conversions,
                'conversion_rate': round(conversion_rate, 2),
                'cost_per_conversion': round(cost_per_conversion, 2),
                'roas': round(roas, 2)
            },
            'health_indicators': self._calculate_health_indicators(
                ctr, conversion_rate, cost_per_conversion, roas
            ),
            'timestamp': datetime.now().isoformat()
        }

        return analysis

    def _calculate_health_indicators(self, ctr, conversion_rate, cost_per_conversion, roas):
        """
        Calculate health indicators based on performance metrics

        Returns: dict with status flags
        """
        indicators = {
            'ctr_status': 'good',  # good, warning, poor
            'conversion_rate_status': 'good',
            'cost_efficiency_status': 'good',
            'roas_status': 'good',
            'overall_health': 'healthy'  # healthy, needs_attention, critical
        }

        # CTR benchmarks
        if ctr < 1.0:
            indicators['ctr_status'] = 'poor'
        elif ctr < 2.0:
            indicators['ctr_status'] = 'warning'

        # Conversion rate benchmarks
        if conversion_rate < 1.0:
            indicators['conversion_rate_status'] = 'poor'
        elif conversion_rate < 2.0:
            indicators['conversion_rate_status'] = 'warning'

        # ROAS benchmarks
        if roas < 2.0:
            indicators['roas_status'] = 'poor'
        elif roas < 4.0:
            indicators['roas_status'] = 'warning'

        # Overall health assessment
        poor_count = sum(1 for status in indicators.values() if status == 'poor')
        warning_count = sum(1 for status in indicators.values() if status == 'warning')

        if poor_count >= 2:
            indicators['overall_health'] = 'critical'
        elif poor_count >= 1 or warning_count >= 2:
            indicators['overall_health'] = 'needs_attention'

        return indicators

    def generate_performance_summary(self, all_campaigns_analysis):
        """
        Generate a summary report across all campaigns

        Returns: formatted summary string
        """
        total_campaigns = len(all_campaigns_analysis)
        total_cost = sum(a['metrics']['cost'] for a in all_campaigns_analysis)
        total_conversions = sum(a['metrics']['conversions'] for a in all_campaigns_analysis)
        total_clicks = sum(a['metrics']['clicks'] for a in all_campaigns_analysis)
        total_impressions = sum(a['metrics']['impressions'] for a in all_campaigns_analysis)

        avg_ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
        avg_cpc = (total_cost / total_clicks) if total_clicks > 0 else 0

        healthy_campaigns = sum(
            1 for a in all_campaigns_analysis
            if a['health_indicators']['overall_health'] == 'healthy'
        )
        critical_campaigns = sum(
            1 for a in all_campaigns_analysis
            if a['health_indicators']['overall_health'] == 'critical'
        )

        summary = f"""
========================================
GOOGLE ADS PERFORMANCE SUMMARY
========================================
Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

OVERVIEW:
  Total Campaigns: {total_campaigns}
  Healthy Campaigns: {healthy_campaigns}
  Critical Campaigns: {critical_campaigns}

AGGREGATE METRICS:
  Total Impressions: {total_impressions:,}
  Total Clicks: {total_clicks:,}
  Average CTR: {avg_ctr:.2f}%
  Total Cost: ${total_cost:,.2f}
  Average CPC: ${avg_cpc:.2f}
  Total Conversions: {total_conversions:,.0f}

CAMPAIGN BREAKDOWN:
"""

        for analysis in all_campaigns_analysis:
            metrics = analysis['metrics']
            health = analysis['health_indicators']['overall_health']
            health_indicator = {
                'healthy': '✓',
                'needs_attention': '⚠',
                'critical': '✗'
            }.get(health, '?')

            summary += f"""
  [{health_indicator}] {analysis['campaign_name']}
      CTR: {metrics['ctr']:.2f}% | Conv Rate: {metrics['conversion_rate']:.2f}% |
      Cost: ${metrics['cost']:,.2f} | ROAS: {metrics['roas']:.2f}x
"""

        summary += "\n========================================\n"

        return summary

    def identify_optimization_opportunities(self, campaign_analysis):
        """
        Identify specific optimization opportunities

        Returns: list of opportunity dicts
        """
        opportunities = []
        metrics = campaign_analysis['metrics']
        health = campaign_analysis['health_indicators']

        # Low CTR opportunity
        if health['ctr_status'] in ['poor', 'warning']:
            opportunities.append({
                'type': 'improve_ctr',
                'priority': 'high' if health['ctr_status'] == 'poor' else 'medium',
                'description': f"CTR is {metrics['ctr']:.2f}%, below benchmark. Consider testing new ad copy or improving targeting.",
                'current_value': metrics['ctr'],
                'target_value': 2.0
            })

        # Low conversion rate opportunity
        if health['conversion_rate_status'] in ['poor', 'warning']:
            opportunities.append({
                'type': 'improve_conversion_rate',
                'priority': 'high' if health['conversion_rate_status'] == 'poor' else 'medium',
                'description': f"Conversion rate is {metrics['conversion_rate']:.2f}%, below benchmark. Review landing pages and keyword relevance.",
                'current_value': metrics['conversion_rate'],
                'target_value': 2.0
            })

        # Poor ROAS opportunity
        if health['roas_status'] in ['poor', 'warning']:
            opportunities.append({
                'type': 'improve_roas',
                'priority': 'critical' if health['roas_status'] == 'poor' else 'high',
                'description': f"ROAS is {metrics['roas']:.2f}x, below target. Consider bid adjustments and negative keywords.",
                'current_value': metrics['roas'],
                'target_value': 4.0
            })

        # High cost per conversion
        if metrics['cost_per_conversion'] > 50:  # Arbitrary threshold
            opportunities.append({
                'type': 'reduce_cost_per_conversion',
                'priority': 'medium',
                'description': f"Cost per conversion is ${metrics['cost_per_conversion']:.2f}. Optimize bids and improve quality scores.",
                'current_value': metrics['cost_per_conversion'],
                'target_value': 30.0
            })

        return opportunities
