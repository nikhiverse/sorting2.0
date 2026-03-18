#ifndef __GLIBC_PREREQ
#define __GLIBC_PREREQ(min, maj) 0
#endif

#include <emscripten.h>
#include <cstdlib>
#include <cstring>
#include <ctime>

#include "sorting.h"

// Shared buffers
int arrayBuffer[MAX_ARRAY_SIZE];
int stepsBuffer[MAX_STEPS * 3]; // each step = [type, i, j]
int stepCount = 0;
int workArray[MAX_ARRAY_SIZE]; // working copy for sorting
int sortOrder = 1; // 1 = ascending, -1 = descending

// Record an animation step
void addStep(int type, int i, int j) {
    if (stepCount < MAX_STEPS) {
        stepsBuffer[stepCount * 3] = type;
        stepsBuffer[stepCount * 3 + 1] = i;
        stepsBuffer[stepCount * 3 + 2] = j;
        stepCount++;
    }
}

void swapElements(int* arr, int i, int j) {
    int temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}

// Mark the entire array as sorted for the visualization
void markAllSorted(int n) {
    for (int i = 0; i < n; i++) {
        addStep(STEP_SORTED, i, -1);
    }
}

// ===================== INCLUDE MODULES =====================
#include "array.cpp"
#include "algo/bubble_sort.cpp"
#include "algo/quick_sort.cpp"
#include "algo/heap_sort.cpp"
#include "algo/merge_sort.cpp"
#include "algo/insertion_sort.cpp"
#include "algo/selection_sort.cpp"
#include "algo/shell_sort.cpp"
#include "algo/tim_sort.cpp"
#include "algo/tree_sort.cpp"
#include "algo/counting_sort.cpp"
#include "algo/bucket_sort.cpp"
#include "algo/radix_sort.cpp"
// ===================== EXPORTED FUNCTIONS =====================
extern "C" {

EMSCRIPTEN_KEEPALIVE
void generateArray(int length) {
    generateRandomArray(length);
}

EMSCRIPTEN_KEEPALIVE
int* getArray() {
    return arrayBuffer;
}

EMSCRIPTEN_KEEPALIVE
int* getSteps() {
    return stepsBuffer;
}

EMSCRIPTEN_KEEPALIVE
int getStepCount() {
    return stepCount;
}

EMSCRIPTEN_KEEPALIVE
void bubbleSort(int length) {
    stepCount = 0;
    memcpy(workArray, arrayBuffer, length * sizeof(int));
    doBubbleSort(workArray, length);
    memcpy(arrayBuffer, workArray, length * sizeof(int));
}

EMSCRIPTEN_KEEPALIVE
void quickSort(int length) {
    stepCount = 0;
    memcpy(workArray, arrayBuffer, length * sizeof(int));
    doQuickSort(workArray, 0, length - 1);
    memcpy(arrayBuffer, workArray, length * sizeof(int));
}

EMSCRIPTEN_KEEPALIVE
void heapSort(int length) {
    stepCount = 0;
    memcpy(workArray, arrayBuffer, length * sizeof(int));
    doHeapSort(workArray, length);
    memcpy(arrayBuffer, workArray, length * sizeof(int));
}

EMSCRIPTEN_KEEPALIVE
void mergeSort(int length) {
    stepCount = 0;
    memcpy(workArray, arrayBuffer, length * sizeof(int));
    doMergeSort(workArray, 0, length - 1);
    markAllSorted(length);
    memcpy(arrayBuffer, workArray, length * sizeof(int));
}

EMSCRIPTEN_KEEPALIVE
void insertionSort(int length) {
    stepCount = 0;
    memcpy(workArray, arrayBuffer, length * sizeof(int));
    doInsertionSort(workArray, length);
    markAllSorted(length);
    memcpy(arrayBuffer, workArray, length * sizeof(int));
}

EMSCRIPTEN_KEEPALIVE
void selectionSort(int length) {
    stepCount = 0;
    memcpy(workArray, arrayBuffer, length * sizeof(int));
    doSelectionSort(workArray, length);
    memcpy(arrayBuffer, workArray, length * sizeof(int));
}

EMSCRIPTEN_KEEPALIVE
void shellSort(int length) {
    stepCount = 0;
    memcpy(workArray, arrayBuffer, length * sizeof(int));
    doShellSort(workArray, length);
    markAllSorted(length);
    memcpy(arrayBuffer, workArray, length * sizeof(int));
}

EMSCRIPTEN_KEEPALIVE
void timSort(int length) {
    stepCount = 0;
    memcpy(workArray, arrayBuffer, length * sizeof(int));
    doTimSort(workArray, length);
    markAllSorted(length);
    memcpy(arrayBuffer, workArray, length * sizeof(int));
}

EMSCRIPTEN_KEEPALIVE
void treeSort(int length) {
    stepCount = 0;
    memcpy(workArray, arrayBuffer, length * sizeof(int));
    doTreeSort(workArray, length);
    memcpy(arrayBuffer, workArray, length * sizeof(int));
}

EMSCRIPTEN_KEEPALIVE
void countingSort(int length) {
    stepCount = 0;
    memcpy(workArray, arrayBuffer, length * sizeof(int));
    doCountingSort(workArray, length);
    markAllSorted(length);
    memcpy(arrayBuffer, workArray, length * sizeof(int));
}

EMSCRIPTEN_KEEPALIVE
void bucketSort(int length) {
    stepCount = 0;
    memcpy(workArray, arrayBuffer, length * sizeof(int));
    doBucketSort(workArray, length);
    markAllSorted(length);
    memcpy(arrayBuffer, workArray, length * sizeof(int));
}

EMSCRIPTEN_KEEPALIVE
void radixSort(int length) {
    stepCount = 0;
    memcpy(workArray, arrayBuffer, length * sizeof(int));
    doRadixSort(workArray, length);
    markAllSorted(length);
    memcpy(arrayBuffer, workArray, length * sizeof(int));
}

EMSCRIPTEN_KEEPALIVE
void setSortOrder(int order) {
    sortOrder = order;
}

} // extern "C"
