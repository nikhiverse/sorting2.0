# Sorting Visualizer 2.0

A highly performant sorting algorithm visualizer powered by **WebAssembly**. All sorting algorithms are immaculately written in **C++** and compiled to WebAssembly (WASM) for near-native execution speeds in the browser. The frontend is built using standard HTML, CSS, and JavaScript.

## 🚀 Features

- **WebAssembly Performance**: Algorithms run at blinding speeds thanks to C++ and Emscripten.
- **Visual Feedback**: Real-time, step-by-step row-by-row rendering of the sorting process with detailed color-coded states (Unsorted, Comparing, Swapping, Pivot, Sorted).
- **Extensive Algorithm Support**:
  - Bubble Sort
  - Insertion Sort
  - Selection Sort
  - Quick Sort
  - Heap Sort
  - Merge Sort
  - Shell Sort
  - Tim Sort
  - Tree Sort
  - Counting Sort
  - Bucket Sort
  - Radix Sort
- ** Granular Controls**:
  - Adjust the number of boxes (array size) via slider
  - Fine-tune visualization speed (0.5x, 1x, 2x, 4x)
  - Generate, Sort, and Reverse actions
- **Live Statistics**: Monitor Swaps, Comparisons, Time, and Space complexity on the fly.
- **Responsive Design**: Flawlessly adapts to desktop, mobile, and tablet displays.

## 🛠️ How to Run Locally

Because the project loads WebAssembly modules (`.wasm` files), it must be run via a local web server to avoid browser cross-origin (CORS) restrictions.

1. Ensure you have Python installed, then serve the current directory:
   ```bash
   python3 -m http.server 8000
   ```
   *(Alternatively, use `npx serve`, Live Server in VS Code, etc.)*
2. Open your web browser and navigate to: `http://localhost:8000`

## ⚙️ Building the WASM Module

If you make any changes to the C++ algorithm files (`sorting.cpp`, `array.cpp`, `algo/`, etc.), you will need to recompile the WebAssembly files (`sorting.js` and `sorting.wasm`).

### Prerequisites
- [Emscripten SDK (emsdk)](https://emscripten.org/docs/getting_started/downloads.html) must be installed and activated.

### Build Steps
Simply run the included build script:
```bash
./build.sh
```
This script invokes Emscripten `emcc` with the appropriate optimization flags, exports necessary functions, and overwrites the existing `.js` and `.wasm` files.

---

**Created by** [rathodnk](https://www.linkedin.com/in/rathodnk/) |  **Contact**: [nikhil.webdna@gmail.com](mailto:nikhil.webdna@gmail.com)
