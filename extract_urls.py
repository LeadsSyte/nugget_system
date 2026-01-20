#!/usr/bin/env python3
"""
URL Extractor Script
Crawls a website and extracts all URLs to a CSV file
"""

import csv
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from collections import deque
import time
import sys


class URLExtractor:
    def __init__(self, base_url, max_pages=None):
        """
        Initialize the URL extractor

        Args:
            base_url: The starting URL to crawl
            max_pages: Maximum number of pages to crawl (None for unlimited)
        """
        self.base_url = base_url
        self.domain = urlparse(base_url).netloc
        self.visited_urls = set()
        self.all_urls = set()
        self.to_visit = deque([base_url])
        self.max_pages = max_pages

    def is_valid_url(self, url):
        """Check if URL is valid and belongs to the same domain"""
        parsed = urlparse(url)
        return bool(parsed.netloc) and bool(parsed.scheme)

    def is_same_domain(self, url):
        """Check if URL belongs to the same domain"""
        return urlparse(url).netloc == self.domain

    def extract_urls_from_page(self, url):
        """Extract all URLs from a given page"""
        try:
            print(f"Crawling: {url}")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Find all links
            for link in soup.find_all('a', href=True):
                href = link['href']
                full_url = urljoin(url, href)

                # Clean URL (remove fragments)
                full_url = full_url.split('#')[0]

                if self.is_valid_url(full_url):
                    self.all_urls.add(full_url)

                    # Add to queue if same domain and not visited
                    if self.is_same_domain(full_url) and full_url not in self.visited_urls:
                        self.to_visit.append(full_url)

            # Also extract URLs from other sources
            for img in soup.find_all('img', src=True):
                img_url = urljoin(url, img['src'])
                if self.is_valid_url(img_url):
                    self.all_urls.add(img_url)

            for script in soup.find_all('script', src=True):
                script_url = urljoin(url, script['src'])
                if self.is_valid_url(script_url):
                    self.all_urls.add(script_url)

            for link in soup.find_all('link', href=True):
                link_url = urljoin(url, link['href'])
                if self.is_valid_url(link_url):
                    self.all_urls.add(link_url)

            return True

        except requests.RequestException as e:
            print(f"Error crawling {url}: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error on {url}: {e}")
            return False

    def crawl(self):
        """Crawl the website and extract all URLs"""
        print(f"Starting crawl of {self.base_url}")
        print(f"Max pages: {self.max_pages if self.max_pages else 'Unlimited'}")
        print("-" * 60)

        while self.to_visit and (self.max_pages is None or len(self.visited_urls) < self.max_pages):
            url = self.to_visit.popleft()

            if url in self.visited_urls:
                continue

            self.visited_urls.add(url)
            self.extract_urls_from_page(url)

            # Be respectful - don't hammer the server
            time.sleep(0.5)

        print("-" * 60)
        print(f"Crawl complete!")
        print(f"Pages visited: {len(self.visited_urls)}")
        print(f"Total URLs found: {len(self.all_urls)}")

    def save_to_csv(self, filename='urls.csv'):
        """Save extracted URLs to CSV file"""
        sorted_urls = sorted(self.all_urls)

        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['URL', 'Domain', 'Type'])

            for url in sorted_urls:
                parsed = urlparse(url)
                domain = parsed.netloc

                # Determine URL type
                url_type = 'Internal' if domain == self.domain else 'External'

                # Further categorize by file type
                path = parsed.path.lower()
                if any(path.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']):
                    url_type += ' - Image'
                elif any(path.endswith(ext) for ext in ['.js']):
                    url_type += ' - JavaScript'
                elif any(path.endswith(ext) for ext in ['.css']):
                    url_type += ' - CSS'
                elif any(path.endswith(ext) for ext in ['.pdf']):
                    url_type += ' - PDF'

                writer.writerow([url, domain, url_type])

        print(f"URLs saved to {filename}")


def main():
    """Main function"""
    # Configuration
    target_url = "https://bagemporium.co.za/"
    output_file = "bagemporium_urls.csv"
    max_pages = 100  # Limit to 100 pages to avoid excessive crawling

    # Allow command line override
    if len(sys.argv) > 1:
        target_url = sys.argv[1]
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    if len(sys.argv) > 3:
        max_pages = int(sys.argv[3]) if sys.argv[3].lower() != 'none' else None

    # Create extractor and run
    extractor = URLExtractor(target_url, max_pages=max_pages)
    extractor.crawl()
    extractor.save_to_csv(output_file)

    print(f"\nDone! Check {output_file} for results.")


if __name__ == "__main__":
    main()
