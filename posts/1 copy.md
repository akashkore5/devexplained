---
id: "1"
title: "Two Sum"
companyTags: "Unknown"
slug: "two-sum"
difficulty: "Easy"
tags: ["Array", "Hash Table"]
---

### Explanation

To solve this problem efficiently, we can use a hashmap to store the difference between the target value and the current element in the array. As we iterate through the array, we check if the current element exists in the hashmap. If it does, we have found a pair of elements that add up to the target value. If not, we store the difference in the hashmap for future reference.

- Time complexity: O(n) - We iterate through the array once.
- Space complexity: O(n) - We store up to n elements in the hashmap.
```java
import java.util.HashMap;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> map = new HashMap<>();
        
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        
        throw new IllegalArgumentException("No two sum solution");
    }
}
```

```cpp
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.find(complement) != map.end()) {
                return { map[complement], i };
            }
            map[nums[i]] = i;
        }
        
        throw runtime_error("No two sum solution");
    }
};
```

```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        map = {}
        
        for i, num in enumerate(nums):
            complement = target - num
            if complement in map:
                return [map[complement], i]
            map[num] = i
        
        raise ValueError("No two sum solution")
```