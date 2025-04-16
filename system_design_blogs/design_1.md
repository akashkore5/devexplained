Here is the expanded blog post:

---
title: "Design a URL Preview Service"
seo: "a, url, preview, service, system design"
---

## Introduction

In today's digital landscape, users often share links and URLs across various platforms. A URL preview service can provide a convenient way to display the content of a webpage without requiring users to leave their current page or application. In this article, we'll explore the design of a URL preview service.

The service will take a URL as input, retrieve the relevant information from the webpage, and return a JSON response containing the preview data. This can be used in various applications such as chatbots, email clients, or news aggregators to provide users with a sneak peek into the content of the linked page.

## DB Schema

For this service, we'll use a simple database schema to store the retrieved information. Here's an example SQL schema:

```sql
CREATE TABLE previews (
    id INT PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    image_url VARCHAR(255)
);

CREATE TABLE crawls (
    id INT PRIMARY KEY,
    preview_id INT,
    html BLOB,
    FOREIGN KEY (preview_id) REFERENCES previews(id)
);
```

In this schema, we have two tables: `previews` and `crawls`. The `previews` table stores the metadata of the previewed URLs, such as title, description, and image URL. The `crawls` table stores the HTML content of the crawled webpages.

## API Endpoints (in Java)

The service will have two main endpoints: `/preview` for retrieving a URL preview and `/crawl` for crawling a webpage. Here are the Java-style API endpoints:

```java
GET /preview?url={url}
Response:
{
    "title": string,
    "description": string,
    "image_url": string
}

POST /crawl?url={url}&html={html_content}
Response:
HTTP 201 Created
```

In the `/preview` endpoint, we'll retrieve the relevant information from the database based on the provided URL. In the `/crawl` endpoint, we'll store the crawled HTML content in the `crawls` table and retrieve the corresponding preview metadata from the `previews` table.

## System Flow

Here's a step-by-step system flow diagram:

1. **User Input**: A user provides a URL to be previewed.
2. **URL Validation**: The service validates the input URL to ensure it's valid and exists in the database.
3. **Database Retrieval**: If the URL is found in the database, retrieve the corresponding preview metadata (title, description, image_url).
4. **Crawling (optional)**: If the URL needs to be crawled, send an HTTP request to the `/crawl` endpoint with the URL and HTML content.
5. **HTML Processing**: Process the received HTML content to extract relevant information (e.g., title, description, images).
6. **Database Storage**: Store the extracted information in the `crawls` table.
7. **Preview Generation**: Generate a preview JSON response containing the retrieved metadata and crawled data.

## Summary

In this article, we've designed a URL preview service that retrieves relevant information from webpages without requiring users to leave their current page or application. The service uses a simple database schema to store the retrieved information and provides two main API endpoints for retrieving previews and crawling webpages. By following this system flow, you can implement your own URL preview service using Java-style API endpoints.

<!-- Optional Sections -->

## ASCII Diagrams

Here's an ASCII diagram illustrating the system flow:
```
          +---------------+
          |  User Input  |
          +---------------+
                  |
                  |  Validate URL
                  v
          +---------------+
          |  Database     |
          |  Retrieval    |
          +---------------+
                  |
                  |  Crawling (if needed)
                  v
          +---------------+
          |  HTML Processing|
          +---------------+
                  |
                  |  Store in Database
                  v
          +---------------+
          |  Preview Generation|
          +---------------+
                  |
                  |  Return JSON Response
                  v
          +---------------+
          |  User Display  |
          +---------------+
```

## OpenAPI Specs

Here's an example OpenAPI spec for the `/preview` endpoint:
```yaml
openapi: 3.0.2
info:
  title: URL Preview Service
  description: Retrieve preview data for a given URL.
  version: 1.0.0

paths:
  /preview:
    get:
      summary: Retrieve preview data for a given URL.
      responses:
        200:
          description: Successful response.
          content:
            application/json:
              schema:
                type: object
                properties:
                  title:
                    type: string
                  description:
                    type: string
                  image_url:
                    type: string

```

## Sample SQL Schema

Here's an example of the database schema in SQL format:

```sql
CREATE TABLE previews (
    id INT PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    image_url VARCHAR(255)
);

CREATE TABLE crawls (
    id INT PRIMARY KEY,
    preview_id INT,
    html BLOB,
    FOREIGN KEY (preview_id) REFERENCES previews(id)
);
```

## Example JSON API Response

Here's an example JSON response for the `/preview` endpoint:
```json
{
  "title": "Example Title",
  "description": "This is an example description.",
  "image_url": "https://example.com/image.jpg"
}
```

I hope this expanded blog post meets your requirements! Let me know if you have any further requests.