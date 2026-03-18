#include "../sorting.h"

void doCountingSort(int* arr, int n) {
    if (n <= 1) return;
    int count[100] = {0};
    
    // Count frequencies
    for (int i = 0; i < n; i++) {
        addStep(STEP_COMPARE, i, i);
        if (arr[i] >= 0 && arr[i] < 100) {
            count[arr[i]]++;
        }
    }
    
    // Reconstruct array
    int index = 0;
    if (sortOrder > 0) {
        for (int v = 0; v < 100; v++) {
            while (count[v] > 0) {
                arr[index] = v;
                addStep(STEP_SET, index, v);
                addStep(STEP_SORTED, index, -1);
                index++;
                count[v]--;
            }
        }
    } else {
        for (int v = 99; v >= 0; v--) {
            while (count[v] > 0) {
                arr[index] = v;
                addStep(STEP_SET, index, v);
                addStep(STEP_SORTED, index, -1);
                index++;
                count[v]--;
            }
        }
    }
}
