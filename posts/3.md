---
id: "3"
title: "Longest Substring Without Repeating Characters"
companyTags: "Unknown"
slug: "longest-substring-without-repeating-characters"
difficulty: "Medium"
tags: ["Hash Table", "String", "Sliding Window"]
---

### Explanation:
To solve this problem, we can use the sliding window technique. We maintain a window that contains characters without repeating characters. We iterate through the string, keep track of the characters we have seen so far using a hashmap to store the index of the characters. If we encounter a character that is already in the window, we update the start index of the window to the next index of the repeated character. We update the maximum length of the substring as we iterate through the string.

1. Initialize a hashmap to store characters and their indices.
2. Initialize variables for the start index of the window, the maximum length of the substring, and the current index.
3. Iterate through the string:
   - Check if the character is in the hashmap and if its index is within the current window.
     - If yes, update the start index of the window to the next index of the repeated character.
   - Update the current character's index in the hashmap.
   - Update the maximum length of the substring.
4. Return the maximum length of the substring.

**Time Complexity:** O(n) where n is the length of the input string.
**Space Complexity:** O(min(n, m)) where n is the length of the input string and m is the size of the character set.

:

```java
class Solution {
    public int lengthOfLongestSubstring(String s) {
        if (s == null || s.length() == 0) {
            return 0;
        }
        
        Map<Character, Integer> charIndexMap = new HashMap<>();
        int maxLength = 0;
        int start = 0;
        
        for (int end = 0; end < s.length(); end++) {
            char c = s.charAt(end);
            if (charIndexMap.containsKey(c) && charIndexMap.get(c) >= start) {
                start = charIndexMap.get(c) + 1;
            }
            charIndexMap.put(c, end);
            maxLength = Math.max(maxLength, end - start + 1);
        }
        
        return maxLength;
    }
}
```

```cpp
class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        if (s.empty()) {
            return 0;
        }
        
        unordered_map<char, int> charIndexMap;
        int maxLength = 0;
        int start = 0;
        
        for (int end = 0; end < s.length(); end++) {
            char c = s[end];
            if (charIndexMap.find(c) != charIndexMap.end() && charIndexMap[c] >= start) {
                start = charIndexMap[c] + 1;
            }
            charIndexMap[c] = end;
            maxLength = max(maxLength, end - start + 1);
        }
        
        return maxLength;
    }
};
```

```python
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        if not s:
            return 0
        
        char_index_map = {}
        max_length = 0
        start = 0
        
        for end, c in enumerate(s):
            if c in char_index_map and char_index_map[c] >= start:
                start = char_index_map[c] + 1
            char_index_map[c] = end
            max_length = max(max_length, end - start + 1)
        
        return max_length
```