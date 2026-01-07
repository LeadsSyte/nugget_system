"""
Gemini AI Brain - Makes strategic decisions for Google Ads optimization
"""

import google.generativeai as genai
import json

class GeminiBrain:
    """AI decision-making engine using Gemini"""

    def __init__(self, config, logger):
        self.config = config
        self.logger = logger

        # Configure Gemini
        genai.configure(api_key=config.gemini_api_key)

        gemini_config = config.get_gemini_config()
        self.model = genai.GenerativeModel(
            model_name=gemini_config.get('model', 'gemini-2.0-flash-exp'),
            generation_config={
                'temperature': gemini_config.get('temperature', 0.7),
                'max_output_tokens': gemini_config.get('max_tokens', 8192),
            }
        )

        self.logger.info(f"Gemini Brain initialized with model: {gemini_config.get('model')}")

    def analyze_bid_performance(self, keyword_data, ad_group_data, campaign_data):
        """
        Analyze keyword performance and recommend bid adjustments

        Returns: dict with 'recommended_bid', 'justification', and 'confidence'
        """
        prompt = f"""You are an expert Google Ads optimizer. Analyze this keyword performance data and recommend a bid adjustment.

KEYWORD DATA:
- Text: {keyword_data.get('text')}
- Current CPC Bid: ${keyword_data.get('cpc_bid', 0):.2f}
- Average CPC: ${keyword_data.get('avg_cpc', 0):.2f}
- Impressions: {keyword_data.get('impressions', 0)}
- Clicks: {keyword_data.get('clicks', 0)}
- CTR: {keyword_data.get('ctr', 0):.2%}
- Conversions: {keyword_data.get('conversions', 0)}
- Cost per Conversion: ${keyword_data.get('cost_per_conversion', 0):.2f}
- Quality Score: {keyword_data.get('quality_score', 'N/A')}

AD GROUP CONTEXT:
- Ad Group: {ad_group_data.get('name')}
- Ad Group Avg CPC: ${ad_group_data.get('avg_cpc', 0):.2f}
- Ad Group CTR: {ad_group_data.get('ctr', 0):.2%}
- Ad Group Conversions: {ad_group_data.get('conversions', 0)}

CAMPAIGN CONTEXT:
- Campaign: {campaign_data.get('name')}
- Campaign Type: {campaign_data.get('type')}

CONSTRAINTS:
- Minimum bid: $0.10
- Maximum bid: $50.00
- Maximum daily change: ±20%

Provide your recommendation in this exact JSON format:
{{
    "recommended_bid": <float>,
    "change_percentage": <float>,
    "justification": "<detailed reasoning for this bid adjustment>",
    "confidence": "<high/medium/low>",
    "key_factors": ["<factor1>", "<factor2>", "<factor3>"]
}}

Focus on ROI, conversion performance, and competitive positioning. Be conservative with bid increases and aggressive with decreases for underperforming keywords."""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)

            self.logger.debug(f"Gemini bid recommendation for '{keyword_data.get('text')}': {result}")
            return result

        except Exception as e:
            self.logger.error(f"Error getting Gemini bid recommendation: {e}")
            return {
                'recommended_bid': keyword_data.get('cpc_bid', 1.0),
                'change_percentage': 0,
                'justification': f'Error occurred: {str(e)}',
                'confidence': 'low',
                'key_factors': []
            }

    def generate_ad_copy(self, campaign_data, ad_group_data, existing_ads, keywords):
        """
        Generate new ad copy variations

        Returns: dict with 'headlines', 'descriptions', 'justification'
        """
        existing_headlines = []
        existing_descriptions = []

        for ad in existing_ads:
            if 'headlines' in ad:
                existing_headlines.extend(ad['headlines'])
            if 'descriptions' in ad:
                existing_descriptions.extend(ad['descriptions'])

        keyword_list = [k.get('text', '') for k in keywords[:10]]  # Top 10 keywords

        prompt = f"""You are an expert Google Ads copywriter. Create high-performing responsive search ad copy.

CAMPAIGN: {campaign_data.get('name')}
CAMPAIGN TYPE: {campaign_data.get('type')}

AD GROUP: {ad_group_data.get('name')}

TOP KEYWORDS:
{', '.join(keyword_list)}

EXISTING AD HEADLINES (for reference - create NEW variations):
{existing_headlines[:5]}

EXISTING AD DESCRIPTIONS (for reference - create NEW variations):
{existing_descriptions[:3]}

PERFORMANCE CONTEXT:
- Current Ad Group CTR: {ad_group_data.get('ctr', 0):.2%}
- Current Conversions: {ad_group_data.get('conversions', 0)}

Create NEW ad copy that:
1. Incorporates top-performing keywords
2. Tests different value propositions
3. Includes strong calls-to-action
4. Follows Google Ads best practices

Provide response in this exact JSON format:
{{
    "headlines": ["<headline1 max 30 chars>", "<headline2>", ..., "<headline5>"],
    "descriptions": ["<description1 max 90 chars>", "<description2>", "<description3>"],
    "justification": "<why these variations will perform better>",
    "testing_hypothesis": "<what we're testing with these variations>"
}}

Requirements:
- 5-8 unique headlines (max 30 characters each)
- 3-4 unique descriptions (max 90 characters each)
- Include keywords naturally
- Create distinct variations to test different angles"""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)

            self.logger.debug(f"Gemini generated ad copy for '{ad_group_data.get('name')}'")
            return result

        except Exception as e:
            self.logger.error(f"Error generating ad copy: {e}")
            return {
                'headlines': [],
                'descriptions': [],
                'justification': f'Error occurred: {str(e)}',
                'testing_hypothesis': ''
            }

    def suggest_keywords(self, campaign_data, ad_group_data, existing_keywords, search_terms_report=None):
        """
        Suggest new keywords to add based on performance data

        Returns: dict with 'keywords', 'justification'
        """
        existing_keyword_texts = [k.get('text', '') for k in existing_keywords]

        prompt = f"""You are an expert Google Ads keyword strategist. Suggest new keywords to add to this ad group.

CAMPAIGN: {campaign_data.get('name')}
CAMPAIGN TYPE: {campaign_data.get('type')}

AD GROUP: {ad_group_data.get('name')}

EXISTING KEYWORDS:
{', '.join(existing_keyword_texts[:20])}

CONTEXT:
- Ad Group Impressions: {ad_group_data.get('impressions', 0)}
- Ad Group CTR: {ad_group_data.get('ctr', 0):.2%}
- Ad Group Conversions: {ad_group_data.get('conversions', 0)}

Based on the existing keywords and ad group theme, suggest 5-10 NEW keywords that:
1. Are highly relevant to the ad group
2. Have commercial intent
3. Complement existing keywords (don't duplicate)
4. Follow a logical keyword expansion strategy

Provide response in this exact JSON format:
{{
    "keywords": [
        {{"text": "<keyword>", "match_type": "BROAD|PHRASE|EXACT", "recommended_bid": <float>, "rationale": "<why this keyword>"}},
        ...
    ],
    "justification": "<overall strategy for these keyword additions>",
    "expected_impact": "<what we expect these keywords to achieve>"
}}

Constraints:
- Suggested bid range: $0.50 - $10.00
- Focus on quality over quantity
- Consider search intent"""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)

            self.logger.debug(f"Gemini suggested {len(result.get('keywords', []))} new keywords")
            return result

        except Exception as e:
            self.logger.error(f"Error suggesting keywords: {e}")
            return {
                'keywords': [],
                'justification': f'Error occurred: {str(e)}',
                'expected_impact': ''
            }

    def identify_negative_keywords(self, campaign_data, search_terms_data, current_performance):
        """
        Identify keywords that should be added as negatives

        Returns: dict with 'negative_keywords', 'justification'
        """
        prompt = f"""You are an expert Google Ads optimizer. Analyze search terms and identify which should be added as negative keywords.

CAMPAIGN: {campaign_data.get('name')}

SEARCH TERMS DATA:
{json.dumps(search_terms_data[:30], indent=2)}

CURRENT PERFORMANCE:
- Campaign CTR: {current_performance.get('ctr', 0):.2%}
- Cost: ${current_performance.get('cost', 0):.2f}
- Conversions: {current_performance.get('conversions', 0)}

Identify search terms that:
1. Have spent budget but generated no conversions
2. Have very low CTR (indicating poor relevance)
3. Are clearly irrelevant to the campaign goal
4. Could cannibalize budget from better-performing terms

Provide response in this exact JSON format:
{{
    "negative_keywords": [
        {{"text": "<keyword>", "match_type": "BROAD|PHRASE|EXACT", "reason": "<why negative>"}},
        ...
    ],
    "justification": "<overall strategy for these negative keywords>",
    "expected_savings": "<estimated budget savings or efficiency gain>"
}}

Be conservative - only suggest negatives that clearly don't fit or consistently underperform."""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)

            self.logger.debug(f"Gemini identified {len(result.get('negative_keywords', []))} negative keywords")
            return result

        except Exception as e:
            self.logger.error(f"Error identifying negative keywords: {e}")
            return {
                'negative_keywords': [],
                'justification': f'Error occurred: {str(e)}',
                'expected_savings': ''
            }

    def evaluate_ad_performance(self, ads_data, threshold_impressions=1000):
        """
        Evaluate ad performance and recommend which ads to pause or keep

        Returns: dict with recommendations
        """
        prompt = f"""You are an expert Google Ads optimizer. Analyze these ad performance data and recommend which ads to pause.

ADS DATA:
{json.dumps(ads_data, indent=2)}

CRITERIA:
- Minimum impressions for evaluation: {threshold_impressions}
- Focus on CTR, conversion rate, and cost efficiency

Identify underperforming ads that should be paused and explain why top performers are working.

Provide response in this exact JSON format:
{{
    "ads_to_pause": [
        {{"ad_id": <id>, "reason": "<specific performance issue>"}},
        ...
    ],
    "top_performers": [
        {{"ad_id": <id>, "reason": "<why this ad is performing well>"}},
        ...
    ],
    "justification": "<overall analysis and recommendations>"
}}

Only recommend pausing ads with sufficient data and clear underperformance."""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json_response(response.text)

            self.logger.debug("Gemini evaluated ad performance")
            return result

        except Exception as e:
            self.logger.error(f"Error evaluating ad performance: {e}")
            return {
                'ads_to_pause': [],
                'top_performers': [],
                'justification': f'Error occurred: {str(e)}'
            }

    def _parse_json_response(self, response_text):
        """Parse JSON from Gemini response, handling markdown code blocks"""
        # Remove markdown code blocks if present
        text = response_text.strip()

        if text.startswith('```json'):
            text = text[7:]  # Remove ```json
        elif text.startswith('```'):
            text = text[3:]  # Remove ```

        if text.endswith('```'):
            text = text[:-3]  # Remove trailing ```

        text = text.strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse Gemini JSON response: {e}")
            self.logger.debug(f"Response text: {response_text}")
            return {}
