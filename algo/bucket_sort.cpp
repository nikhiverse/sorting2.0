#include "../sorting.h"

// Bucket sort for integers in range [2, 96]
static void sortBucket(int* bucket, int size) {
    for (int i = 1; i < size; i++) {
        int key = bucket[i];
        int j = i - 1;
        while (j >= 0 && sortLess(key, bucket[j])) {
            bucket[j + 1] = bucket[j];
            j--;
        }
        bucket[j + 1] = key;
    }
}

void doBucketSort(int* arr, int n) {
    if (n <= 1) return;
    int buckets[10][MAX_ARRAY_SIZE];
    int bucketSizes[10] = {0};
    
    // Scatter into buckets based on tens digit (since max is 96)
    for (int i = 0; i < n; i++) {
        addStep(STEP_COMPARE, i, i); // visualize read
        int bIdx = arr[i] / 10;
        if (bIdx > 9) bIdx = 9;
        if (bIdx < 0) bIdx = 0;
        buckets[bIdx][bucketSizes[bIdx]] = arr[i];
        bucketSizes[bIdx]++;
    }
    
    // Sort local buckets
    for (int i = 0; i < 10; i++) {
        sortBucket(buckets[i], bucketSizes[i]);
    }
    
    // Gather back
    int index = 0;
    if (sortOrder > 0) {
        for (int i = 0; i < 10; i++) {
            for (int j = 0; j < bucketSizes[i]; j++) {
                arr[index] = buckets[i][j];
                addStep(STEP_SET, index, arr[index]);
                addStep(STEP_SORTED, index, -1);
                index++;
            }
        }
    } else {
        for (int i = 9; i >= 0; i--) {
            for (int j = bucketSizes[i] - 1; j >= 0; j--) {
                arr[index] = buckets[i][j];
                addStep(STEP_SET, index, arr[index]);
                addStep(STEP_SORTED, index, -1);
                index++;
            }
        }
    }
}
