#pragma once

// Step types
#define STEP_COMPARE 0
#define STEP_SWAP    1
#define STEP_SORTED  2
#define STEP_PIVOT   3
#define STEP_SET     4

// Max limits
#define MAX_ARRAY_SIZE 64
#define MAX_STEPS 50000

// Shared buffers
extern int arrayBuffer[MAX_ARRAY_SIZE];
extern int stepsBuffer[MAX_STEPS * 3]; // each step = [type, i, j]
extern int stepCount;
extern int workArray[MAX_ARRAY_SIZE]; // working copy for sorting

// Sort direction: 1 = ascending (default), -1 = descending
extern int sortOrder;

static inline int sortLess(int a, int b) {
    return sortOrder > 0 ? (a < b) : (a > b);
}
static inline int sortLessEq(int a, int b) {
    return sortOrder > 0 ? (a <= b) : (a >= b);
}

// Function declarations
void addStep(int type, int i, int j);
void swapElements(int* arr, int i, int j);

