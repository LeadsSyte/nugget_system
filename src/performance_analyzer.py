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
        Focus: Lead Gen optimization (Conversions & Cost Per Conversion)

        Returns: dict with status flags
        """
        indicators = {
            'ctr_status': 'good',  # good, warning, poor
            'conversion_rate_status': 'good',
            'cost_efficiency_status': 'good',
            'overall_health': 'healthy'  # healthy, needs_attention, critical
        }

        # CTR benchmarks (lead gen typically has lower CTR than ecommerce)
        if ctr < 1.0:
            indicators['ctr_status'] = 'poor'
        elif ctr < 2.0:
            indicators['ctr_status'] = 'warning'

        # Conversion rate benchmarks (leads)
        if conversion_rate < 2.0:
            indicators['conversion_rate_status'] = 'poor'
        elif conversion_rate < 5.0:
            indicators['conversion_rate_status'] = 'warning'

        # Cost Per Conversion benchmarks (PRIMARY METRIC FOR LEAD GEN)
        # Thresholds can be configured per industry
        if cost_per_conversion == 0:
            indicators['cost_efficiency_status'] = 'poor'  # No conversions
        elif cost_per_conversion > 100:
            indicators['cost_efficiency_status'] = 'poor'
        elif cost_per_conversion > 50:
            indicators['cost_efficiency_status'] = 'warning'

        # Overall health assessment (prioritize conversion metrics for lead gen)
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
      Conversions: {metrics['conversions']:.0f} | Cost/Conv: ${metrics['cost_per_conversion']:.2f} |
      Conv Rate: {metrics['conversion_rate']:.2f}% | Cost: ${metrics['cost']:,.2f}
"""

        summary += "\n========================================\n"

        return summary

    def identify_optimization_opportunities(self, campaign_analysis):
        """
        Identify specific optimization opportunities
        Focus: Lead Gen (maximize conversions, minimize cost per conversion)

        Returns: list of opportunity dicts
        """
        opportunities = []
        metrics = campaign_analysis['metrics']
        health = campaign_analysis['health_indicators']

        # High Cost Per Conversion (PRIMARY CONCERN FOR LEAD GEN)
        if health['cost_efficiency_status'] in ['poor', 'warning']:
            opportunities.append({
                'type': 'reduce_cost_per_conversion',
                'priority': 'critical' if health['cost_efficiency_status'] == 'poor' else 'high',
                'description': f"Cost per conversion is ${metrics['cost_per_conversion']:.2f}. Optimize bids, improve quality scores, and add negative keywords to reduce wasted spend.",
                'current_value': metrics['cost_per_conversion'],
                'target_value': 40.0
            })

        # Low conversion rate (impacts total leads)
        if health['conversion_rate_status'] in ['poor', 'warning']:
            opportunities.append({
                'type': 'improve_conversion_rate',
                'priority': 'critical' if health['conversion_rate_status'] == 'poor' else 'high',
                'description': f"Conversion rate is {metrics['conversion_rate']:.2f}%, below benchmark. Review landing pages, form friction, and keyword intent match.",
                'current_value': metrics['conversion_rate'],
                'target_value': 5.0
            })

        # Low CTR (reduces overall lead volume)
        if health['ctr_status'] in ['poor', 'warning']:
            opportunities.append({
                'type': 'improve_ctr',
                'priority': 'high' if health['ctr_status'] == 'poor' else 'medium',
                'description': f"CTR is {metrics['ctr']:.2f}%, below benchmark. Test new ad copy with stronger value propositions and calls-to-action.",
                'current_value': metrics['ctr'],
                'target_value': 2.0
            })

        # Low conversion volume (not enough leads)
        if metrics['conversions'] < 10:
            opportunities.append({
                'type': 'increase_conversion_volume',
                'priority': 'high',
                'description': f"Only {metrics['conversions']:.0f} conversions generated. Consider expanding keyword targeting and increasing bids for high-intent terms.",
                'current_value': metrics['conversions'],
                'target_value': 20.0
            })

        return opportunities
