# LeetcodeSolve
<!-- 
![LeetcodeSolve](https://img.shields.io/badge/Next.js-14.2.15-black?logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.14-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-blue) -->

**LeetcodeSolve** is a modern web application built with Next.js to provide detailed Leetcode problem solutions in Java, C++, and Python. It features a responsive design, animated UI, dark mode, and efficient navigation for coding enthusiasts preparing for technical interviews.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [File Structure](#file-structure)
- [Contributing](#contributing)
- [License](#license)

## Overview

LeetcodeSolve offers a clean, user-friendly platform to explore Leetcode problems with in-depth explanations and multi-language solutions. Built with Next.js and styled using Tailwind CSS, it includes a shared layout for consistent navigation, custom dropdowns for filtering, and Framer Motion animations for a polished experience. The app supports dark mode, responsive layouts, and static site generation for performance.

### Tech Stack
- **Frontend**: Next.js 14.2.15, React 18
- **Styling**: Tailwind CSS 3.4.14
- **Animations**: Framer Motion
- **Markdown Parsing**: gray-matter, remark, remark-html
- **Code Highlighting**: highlight.js
- **Notifications**: react-hot-toast
- **Node.js**: 20.x or higher

## Features

- **Shared Layout**: Sticky header (`Home`, `Leetcode`, theme toggle) and footer (About, Contact, GitHub) across all pages, ensuring consistency.
- **Sticky Footer**: Footer remains at the viewport bottom, even with minimal content.
- **Custom Dropdowns**: Animated, accessible dropdowns for filtering problems by difficulty, tag, or items per page.
- **Multi-Language Solutions**: Java, C++, and Python code blocks with copy-to-clipboard functionality and syntax highlighting.
- **Responsive Design**: Mobile-friendly with hamburger menu, tablet/desktop optimized (`max-w-7xl`).
- **Dark Mode**: Toggle between light (`bg-gray-50`) and dark (`bg-slate-900`) themes, persisted via localStorage.
- **Animations**: Smooth transitions for page content, dropdowns, and mobile menu using Framer Motion.
- **Filtering & Pagination**: Search by title/ID, filter by difficulty or tag, and paginate results.
- **Tag Navigation**: Redirects like `/leetcode/tags/array` to `/leetcode?tag=array`.
- **Static Generation**: Pre-rendered pages for fast loading via `getStaticPaths` and `getStaticProps`.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/leetcodesolve.git
   cd leetcodesolve
   ```

2. **Install Dependencies**:
   Ensure Node.js 20.x is installed, then run:
   ```bash
   npm install
   ```

3. **Verify Data Files**:
   - Ensure `data/problems.json` exists, e.g.:
     ```json
     [
       { "id": "1", "title": "Two Sum", "difficulty": "Easy", "tags": ["array", "hashmap"] },
       { "id": "2", "title": "Add Two Numbers", "difficulty": "Medium", "tags": ["linked-list"] }
     ]
     ```
   - Check `posts/*.md` for markdown files, e.g., `posts/1.md`:
     ```md
     ---
     title: "Two Sum"
     difficulty: "Easy"
     tags: ["array", "hashmap"]
     ---
     ## Explanation
     Given an array of integers...
     ```java
     class Solution {
         public int[] twoSum(int[] nums, int target) { ... }
     }
     ```
     ```cpp
     vector<int> twoSum(vector<int>& nums, int target) { ... }
     ```
     ```python
     def twoSum(nums: List[int], target: int) -> List[int]: ...
     ```
     ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   npm run start
   ```

## Usage

1. **Home Page (`/`)**:
   - Explore the hero section with a call-to-action to start solving.
   - View features, stats, testimonials, and a newsletter signup (demo alert).
   - Toggle dark mode via the header.

2. **Leetcode List (`/leetcode`)**:
   - Filter problems by:
     - **Search**: Title or ID (e.g., "Two Sum" or "1").
     - **Difficulty**: All, Easy, Medium, Hard.
     - **Tag**: Array, Hashmap, etc.
     - **Items per Page**: 10, 25, 50.
   - Navigate pages with `Prev`/`Next` buttons.
   - Click tags (e.g., `array`) to filter: `/leetcode?tag=array`.
   - Click a problem (e.g., `1. Two Sum`) to view details.

3. **Problem Page (`/leetcode/[id]`)**:
   - Read the problem explanation (markdown-rendered).
   - Switch between Java, C++, Python solutions using tabs (default: Java).
   - Copy code with the copy button (shows "Code copied!" toast).
   - Click tags to filter related problems.

4. **Dark Mode**:
   - Toggle via the header icon to switch between light and dark themes.

## File Structure

```
leetcodesolve/
├── components/
│   ├── Dropdown.js          # Animated dropdown for filters
│   ├── Layout.js           # Shared header/footer layout
├── data/
│   ├── problems.json       # Problem metadata (id, title, difficulty, tags)
├── pages/
│   ├── index.js            # Home page (hero, features, stats)
│   ├── leetcode/
│   │   ├── index.js        # Problem list with filters and pagination
│   │   ├── [id].js         # Individual problem page (Java, C++, Python)
├── posts/
│   ├── 1.md                # Markdown file for problem 1 (Two Sum)
│   ├── 2.md                # Markdown file for problem 2, etc.
├── styles/
│   ├── global.css          # Global styles (if any)
├── public/                 # Static assets (images, favicon)
├── tailwind.config.js      # Tailwind CSS configuration
├── package.json            # Dependencies and scripts
├── README.md               # Project documentation
```

## Contributing

1. **Fork the Repository**:
   Click "Fork" on GitHub to create your copy.

2. **Create a Branch**:
   ```bash
   git checkout -b feature/your-feature
   ```

3. **Make Changes**:
   - Add new problems to `data/problems.json` and `posts/*.md`.
   - Ensure tags are lowercase (e.g., `"array"`).
   - Maintain Tailwind classes (`bg-gray-50`, `text-indigo-600`).

4. **Test Locally**:
   ```bash
   npm run dev
   ```

5. **Submit a Pull Request**:
   - Push to your fork:
     ```bash
     git push origin feature/your-feature
     ```
   - Open a PR with a clear description.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ by the LeetcodeSolve team.*