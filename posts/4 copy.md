---
id: "4"
title: "Median of Two Sorted Arrays"
companyTags: "Unknown"
slug: "median-of-two-sorted-arrays"
difficulty: "Hard"
tags: ["Array", "Binary Search", "Divide and Conquer"]
---

### Explanation
To find the median of two sorted arrays efficiently, we can use the concept of binary search. By partitioning both arrays into two parts at different positions, we can ensure that elements on the left side are smaller than elements on the right side. The median will then be the average of the maximum element on the left side and the minimum element on the right side. We adjust the partition positions based on the comparison of elements to maintain this property.

1. Initialize variables `m`, `n`, `low`, `high`, `leftMax`, `rightMin`, and perform binary search on the smaller array.
2. Calculate partition positions `partitionX` and `partitionY` using binary search.
3. Update the partition positions based on the comparison of elements to ensure the property mentioned above.
4. Calculate the median based on the number of elements in the combined arrays.

Time complexity: O(log(min(m, n)))
Space complexity: O(1)
```java
class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        if (nums1.length > nums2.length) {
            return findMedianSortedArrays(nums2, nums1);
        }
        
        int m = nums1.length;
        int n = nums2.length;
        int low = 0, high = m;
        
        while (low <= high) {
            int partitionX = (low + high) / 2;
            int partitionY = (m + n + 1) / 2 - partitionX;
            
            int leftMaxX = (partitionX == 0) ? Integer.MIN_VALUE : nums1[partitionX - 1];
            int rightMinX = (partitionX == m) ? Integer.MAX_VALUE : nums1[partitionX];
            
            int leftMaxY = (partitionY == 0) ? Integer.MIN_VALUE : nums2[partitionY - 1];
            int rightMinY = (partitionY == n) ? Integer.MAX_VALUE : nums2[partitionY];
            
            if (leftMaxX <= rightMinY && leftMaxY <= rightMinX) {
                if ((m + n) % 2 == 0) {
                    return (Math.max(leftMaxX, leftMaxY) + Math.min(rightMinX, rightMinY)) / 2.0;
                } else {
                    return Math.max(leftMaxX, leftMaxY);
                }
            } else if (leftMaxX > rightMinY) {
                high = partitionX - 1;
            } else {
                low = partitionX + 1;
            }
        }
        
        throw new IllegalArgumentException("Input arrays are not sorted!");
    }
}
```

```cpp
class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        if (nums1.size() > nums2.size()) {
            return findMedianSortedArrays(nums2, nums1);
        }
        
        int m = nums1.size();
        int n = nums2.size();
        int low = 0, high = m;
        
        while (low <= high) {
            int partitionX = (low + high) / 2;
            int partitionY = (m + n + 1) / 2 - partitionX;
            
            int leftMaxX = (partitionX == 0) ? INT_MIN : nums1[partitionX - 1];
            int rightMinX = (partitionX == m) ? INT_MAX : nums1[partitionX];
            
            int leftMaxY = (partitionY == 0) ? INT_MIN : nums2[partitionY - 1];
            int rightMinY = (partitionY == n) ? INT_MAX : nums2[partitionY];
            
            if (leftMaxX <= rightMinY && leftMaxY <= rightMinX) {
                if ((m + n) % 2 == 0) {
                    return (max(leftMaxX, leftMaxY) + min(rightMinX, rightMinY)) / 2.0;
                } else {
                    return max(leftMaxX, leftMaxY);
                }
            } else if (leftMaxX > rightMinY) {
                high = partitionX - 1;
            } else {
                low = partitionX + 1;
            }
        }
        
        throw invalid_argument("Input arrays are not sorted!");
    }
};
```

```python
class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        if len(nums1) > len(nums2):
            return self.findMedianSortedArrays(nums2, nums1)
        
        m, n = len(nums1), len(nums2)
        low, high = 0, m
        
        while low <= high:
            partitionX = (low + high) // 2
            partitionY = (m + n + 1) // 2 - partitionX
            
            leftMaxX = float('-inf') if partitionX == 0 else nums1[partitionX - 1]
            rightMinX = float('inf') if partitionX == m else nums1[partitionX]
            
            leftMaxY = float('-inf') if partitionY == 0 else nums2[partitionY - 1]
            rightMinY = float('inf') if partitionY == n else nums2[partitionY]
            
            if leftMaxX <= rightMinY and leftMaxY <= rightMinX:
                if (m + n) % 2 == 0:
                    return (max(leftMaxX, leftMaxY) + min(rightMinX, rightMinY)) / 2.0
                else:
                    return max(leftMaxX, leftMaxY)
            elif leftMaxX > rightMinY:
                high = partitionX - 1
            else:
                low = partitionX + 1
        
        raise ValueError("Input arrays are not sorted!")
```