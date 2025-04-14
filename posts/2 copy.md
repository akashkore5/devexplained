---
id: "2"
title: "Add Two Numbers"
companyTags: "Unknown"
slug: "add-two-numbers"
difficulty: "Medium"
tags: ["Linked List", "Math", "Recursion"]
---

### Explanation
To solve this problem, we iterate through both linked lists simultaneously, adding the corresponding digits along with any carry from the previous step. We create a dummy node to hold the result and maintain a current pointer to track the current node we are working on. We keep iterating until both input linked lists are processed and there is no carry left. At each step, we update the carry, create a new node for the result, and move the current pointer to the next node.

**Algorithm:**
1. Initialize a dummy node and a current node to track the result linked list.
2. Initialize carry as 0.
3. Iterate through both input linked lists until we reach the end of both lists and there is no carry left.
4. At each step, calculate the sum of two digits along with the carry.
5. Update the carry for the next iteration.
6. Create a new node with the sum % 10 and move the current pointer.
7. Finally, return the next node of the dummy node as the head of the result linked list.

**Time Complexity:** O(max(N, M)), where N and M are the lengths of the two input linked lists.

**Space Complexity:** O(max(N, M)), for the result linked list.
```java
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(0);
        ListNode current = dummy;
        int carry = 0;
        
        while (l1 != null || l2 != null || carry > 0) {
            int sum = carry;
            if (l1 != null) {
                sum += l1.val;
                l1 = l1.next;
            }
            if (l2 != null) {
                sum += l2.val;
                l2 = l2.next;
            }
            
            carry = sum / 10;
            current.next = new ListNode(sum % 10);
            current = current.next;
        }
        
        return dummy.next;
    }
}
```

```cpp
class Solution {
public:
    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {
        ListNode* dummy = new ListNode(0);
        ListNode* current = dummy;
        int carry = 0;
        
        while (l1 != NULL || l2 != NULL || carry > 0) {
            int sum = carry;
            if (l1 != NULL) {
                sum += l1->val;
                l1 = l1->next;
            }
            if (l2 != NULL) {
                sum += l2->val;
                l2 = l2->next;
            }
            
            carry = sum / 10;
            current->next = new ListNode(sum % 10);
            current = current->next;
        }
        
        return dummy->next;
    }
};
```

```python
class Solution:
    def addTwoNumbers(self, l1: ListNode, l2: ListNode) -> ListNode:
        dummy = ListNode(0)
        current = dummy
        carry = 0
        
        while l1 or l2 or carry:
            sum_val = carry
            if l1:
                sum_val += l1.val
                l1 = l1.next
            if l2:
                sum_val += l2.val
                l2 = l2.next
            
            carry = sum_val // 10
            current.next = ListNode(sum_val % 10)
            current = current.next
        
        return dummy.next
```