#!/bin/bash
# Build sorting.cpp to WebAssembly
# Requires Emscripten SDK: source ~/emsdk/emsdk_env.sh

source ~/emsdk/emsdk_env.sh

emcc sorting.cpp -o sorting.js \
  -s EXPORTED_FUNCTIONS="['_generateArray','_getArray','_getSteps','_getStepCount','_bubbleSort','_quickSort','_heapSort','_mergeSort','_insertionSort','_selectionSort','_shellSort','_timSort','_treeSort','_countingSort','_bucketSort','_radixSort','_setSortOrder','_malloc','_free']" \
  -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap','getValue','setValue']" \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="'SortingModule'" \
  -O2

echo "Build complete: sorting.js + sorting.wasm"
