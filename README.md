# Website URL Extractor

A Python script to crawl websites and extract all URLs into a CSV file.

## Features

- Crawls a website starting from a base URL
- Extracts all URLs (internal links, external links, images, scripts, stylesheets)
- Categorizes URLs by type (Internal/External, Image, JavaScript, CSS, PDF)
- Saves results to a CSV file
- Respects server resources with built-in delays
- Configurable crawl limits

## Installation

1. Install Python 3.7 or higher
2. Install dependencies:

```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage

Run the script with default settings (crawls https://bagemporium.co.za/):

```bash
python extract_urls.py
```

This will create a file called `bagemporium_urls.csv` with all discovered URLs.

### Custom URL

Extract URLs from a different website:

```bash
python extract_urls.py https://example.com
```

### Custom Output File

Specify a custom output filename:

```bash
python extract_urls.py https://example.com custom_output.csv
```

### Custom Page Limit

Control how many pages to crawl (default is 100):

```bash
python extract_urls.py https://example.com output.csv 50
```

Or crawl unlimited pages (use with caution):

```bash
python extract_urls.py https://example.com output.csv none
```

## Output Format

The CSV file contains three columns:

- **URL**: The full URL discovered
- **Domain**: The domain name of the URL
- **Type**: Classification of the URL:
  - Internal - Page on the same domain
  - External - Page on a different domain
  - Internal - Image / External - Image
  - Internal - JavaScript / External - JavaScript
  - Internal - CSS / External - CSS
  - Internal - PDF / External - PDF

## Configuration

You can modify the script's behavior by editing these parameters in `extract_urls.py`:

- `max_pages`: Maximum number of pages to crawl (default: 100)
- `time.sleep()`: Delay between requests in seconds (default: 0.5)

## Notes

- The script only crawls pages within the same domain
- It extracts URLs from links, images, scripts, and stylesheets
- A 0.5-second delay is added between requests to be respectful to servers
- Duplicate URLs are automatically removed
