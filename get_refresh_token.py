#!/usr/bin/env python3
"""
Simple script to get Google Ads API refresh token
"""

from google_auth_oauthlib.flow import InstalledAppFlow

# Your OAuth credentials
CLIENT_ID = "67565505954-bcstvpmk2hhverlsqoprt049qgvjtj1b.apps.googleusercontent.com"
CLIENT_SECRET = "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"

# Google Ads API scope
SCOPES = ['https://www.googleapis.com/auth/adwords']

def main():
    print("=" * 60)
    print("Google Ads API - Refresh Token Generator")
    print("=" * 60)
    print()

    # Create the flow
    flow = InstalledAppFlow.from_client_config(
        {
            "installed": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": ["http://localhost"]
            }
        },
        scopes=SCOPES
    )

    print("This will open a browser window for you to authorize access.")
    print("After you authorize, you'll be redirected to a page that may show an error.")
    print("That's OK! Just copy the entire URL from your browser and paste it here.")
    print()

    # Run the local server flow
    try:
        credentials = flow.run_local_server(port=8080, open_browser=True)

        print()
        print("=" * 60)
        print("SUCCESS! Here is your refresh token:")
        print("=" * 60)
        print()
        print(credentials.refresh_token)
        print()
        print("=" * 60)
        print("Copy this token and give it to Claude!")
        print("=" * 60)

    except Exception as e:
        print()
        print("If the browser didn't open, use this URL:")
        auth_url, _ = flow.authorization_url(prompt='consent')
        print()
        print(auth_url)
        print()
        print("After authorizing, paste the redirect URL here:")
        code = input("Paste the full URL: ").strip()

        # Extract code from URL
        if 'code=' in code:
            code = code.split('code=')[1].split('&')[0]

        flow.fetch_token(code=code)

        print()
        print("=" * 60)
        print("SUCCESS! Here is your refresh token:")
        print("=" * 60)
        print()
        print(flow.credentials.refresh_token)
        print()
        print("=" * 60)

if __name__ == "__main__":
    main()
