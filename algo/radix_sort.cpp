#include "../sorting.h"

void doRadixSort(int* arr, int n) {
    if (n <= 1) return;
    
    int maxVal = 0;
    for (int i = 0; i < n; i++) {
        addStep(STEP_COMPARE, i, i);
        if (arr[i] > maxVal) maxVal = arr[i];
    }
    
    int output[MAX_ARRAY_SIZE];
    for (int exp = 1; maxVal / exp > 0; exp *= 10) {
        int count[10] = {0};
        
        // Count frequencies of digit
        for (int i = 0; i < n; i++) {
            addStep(STEP_COMPARE, i, i);
            int digit = (arr[i] / exp) % 10;
            if (sortOrder < 0) digit = 9 - digit; 
            count[digit]++;
        }
        
        // Cumulative count
        for (int i = 1; i < 10; i++) {
            count[i] += count[i - 1];
        }
        
        // Build the output array stably
        for (int i = n - 1; i >= 0; i--) {
            int digit = (arr[i] / exp) % 10;
            if (sortOrder < 0) digit = 9 - digit;
            output[count[digit] - 1] = arr[i];
            count[digit]--;
        }
        
        // Copy back to arr and record steps
        for (int i = 0; i < n; i++) {
            arr[i] = output[i];
            addStep(STEP_SET, i, arr[i]);
        }
    }
}
