#ifndef __GLIBC_PREREQ
#define __GLIBC_PREREQ(min, maj) 0
#endif

#include "sorting.h"
#include <stdlib.h>
#include <time.h>

// ===================== ARRAY GENERATION =====================
// Generates an array of unique random values (no repeats) in range [8, 96]
// Uses Fisher-Yates shuffle on the full range, then picks the first 'length' values

static void generateRandomArray(int length) {
    // Pool of all possible values: 2 to 96 (95 values)
    const int MIN_VAL = 2;
    const int MAX_VAL = 96;
    const int POOL_SIZE = MAX_VAL - MIN_VAL + 1; // 95

    int pool[95]; // POOL_SIZE = 95
    for (int i = 0; i < POOL_SIZE; i++) {
        pool[i] = MIN_VAL + i;
    }

    // Fisher-Yates shuffle
    static bool seeded = false;
    if (!seeded) {
        srand(time(NULL));
        seeded = true;
    }

    for (int i = POOL_SIZE - 1; i > 0; i--) {
        int j = rand() % (i + 1);
        int temp = pool[i];
        pool[i] = pool[j];
        pool[j] = temp;
    }

    // Copy first 'length' values to arrayBuffer (all unique)
    int count = length < MAX_ARRAY_SIZE ? length : MAX_ARRAY_SIZE;
    if (count > POOL_SIZE) count = POOL_SIZE;

    for (int i = 0; i < count; i++) {
        arrayBuffer[i] = pool[i];
    }
}
