// ===== SORTING VISUALIZER — MAIN APPLICATION =====

(function () {
  "use strict";

  // ===== STATE =====
  let wasmModule = null;
  let currentArray = [];
  let selectedAlgorithm = null;
  let isRunning = false;
  let animationTimer = null;
  let barCount = 12;
  let isSorted = false;

  // Speed map (ms per step)
  const SPEEDS = {
    slow: 120,
    normal: 50,
    fast: 18,
    ultra: 4,
  };
  let currentSpeed = "normal";

  const STEP_COMPARE = 0;
  const STEP_SWAP = 1;
  const STEP_SORTED = 2;
  const STEP_PIVOT = 3;
  const STEP_SET = 4;

  const algoStats = {
    bubbleSort: { time: "O(n²)", space: "O(1)" },
    insertionSort: { time: "O(n²)", space: "O(1)" },
    selectionSort: { time: "O(n²)", space: "O(1)" },
    quickSort: { time: "O(n log n)", space: "O(log n)" },
    heapSort: { time: "O(n log n)", space: "O(1)" },
    mergeSort: { time: "O(n log n)", space: "O(n)" },
    shellSort: { time: "O(n log n)", space: "O(1)" },
    timSort: { time: "O(n log n)", space: "O(n)" },
    treeSort: { time: "O(n log n)", space: "O(n)" },
    countingSort: { time: "O(n + k)", space: "O(n + k)" },
    bucketSort: { time: "O(n + k)", space: "O(n)" },
    radixSort: { time: "O(d(n + k))", space: "O(n + k)" }
  };

  // ===== DOM REFERENCES =====
  const barsContainer = document.getElementById("bars-container");
  const loadingOverlay = document.getElementById("loading-overlay");
  const sizeSlider = document.getElementById("size-slider");
  const sizeValue = document.getElementById("size-value");
  const btnGenerate = document.getElementById("btn-generate");
  const btnSort = document.getElementById("btn-sort");
  const btnReverse = document.getElementById("btn-reverse");
  const algoButtons = document.querySelectorAll(".algo-btn");
  const speedButtons = document.querySelectorAll(".speed-btn");
  const statsPanel = document.getElementById("stats-panel");
  const statSwaps = document.getElementById("stat-swaps");
  const statComparisons = document.getElementById("stat-comparisons");
  const statTime = document.getElementById("stat-time");
  const statSpace = document.getElementById("stat-space");

  // ===== WASM INITIALIZATION =====
  console.log("Initializing WASM module...");
  SortingModule().then(function (Module) {
    console.log("WASM Module loaded successfully!");
    wasmModule = {
      generateArray: Module.cwrap("generateArray", null, ["number"]),
      getArray: Module.cwrap("getArray", "number", []),
      getSteps: Module.cwrap("getSteps", "number", []),
      getStepCount: Module.cwrap("getStepCount", "number", []),
      bubbleSort: Module.cwrap("bubbleSort", null, ["number"]),
      quickSort: Module.cwrap("quickSort", null, ["number"]),
      heapSort: Module.cwrap("heapSort", null, ["number"]),
      mergeSort: Module.cwrap("mergeSort", null, ["number"]),
      insertionSort: Module.cwrap("insertionSort", null, ["number"]),
      selectionSort: Module.cwrap("selectionSort", null, ["number"]),
      shellSort: Module.cwrap("shellSort", null, ["number"]),
      timSort: Module.cwrap("timSort", null, ["number"]),
      treeSort: Module.cwrap("treeSort", null, ["number"]),
      countingSort: Module.cwrap("countingSort", null, ["number"]),
      bucketSort: Module.cwrap("bucketSort", null, ["number"]),
      radixSort: Module.cwrap("radixSort", null, ["number"]),
      setSortOrder: Module.cwrap("setSortOrder", null, ["number"]),
      getValue: Module.getValue,
      _module: Module,
    };

    loadingOverlay.classList.add("hidden");
    generateNewArray();
    console.log("Array generated, bars:", currentArray.length, "values:", currentArray.slice(0, 5));
  }).catch(function (err) {
    console.error("WASM Module failed to load:", err);
    loadingOverlay.querySelector("p").textContent = "Failed to load WASM: " + err.message;
  });

  // ===== ARRAY GENERATION =====
  function generateNewArray() {
    if (!wasmModule || isRunning) return;

    wasmModule.generateArray(barCount);
    readArrayFromWasm();
    renderBars();
    isSorted = false;
    btnReverse.classList.add("hidden");
    btnReverse.disabled = true;
    statsPanel.classList.add("hidden");
    updateSortButton();
  }

  function readArrayFromWasm() {
    const ptr = wasmModule.getArray();
    currentArray = [];
    for (let i = 0; i < barCount; i++) {
      currentArray.push(wasmModule.getValue(ptr + i * 4, 'i32'));
    }
  }

  // ===== RENDERING =====
  function createRow(array, highlights = {}) {
    const row = document.createElement("div");
    row.className = "array-row";
    for (let i = 0; i < array.length; i++) {
      const bar = document.createElement("div");
      let baseClass = "bar";
      if (highlights[i]) {
        baseClass += " " + highlights[i];
      }
      bar.className = baseClass;
      bar.dataset.baseClass = baseClass;
      bar.textContent = array[i];
      row.appendChild(bar);
    }
    return row;
  }

  function renderBars() {
    barsContainer.innerHTML = "";
    barsContainer.appendChild(createRow(currentArray));
  }

  function updateLastRowBarState(index, state) {
    const rows = barsContainer.children;
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      const bars = lastRow.children;
      if (bars[index]) {
        if (state) {
          bars[index].className = "bar " + state;
        } else {
          bars[index].className = bars[index].dataset.baseClass || "bar";
        }
      }
    }
  }

  function setLastRowBaseState(index, state) {
    const rows = barsContainer.children;
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      const bars = lastRow.children;
      if (bars[index]) {
        const newClass = "bar" + (state ? " " + state : "");
        bars[index].dataset.baseClass = newClass;
        bars[index].className = newClass;
      }
    }
  }

  function clearLastRowStates() {
    const rows = barsContainer.children;
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      const bars = lastRow.children;
      for (let i = 0; i < bars.length; i++) {
        bars[i].className = "bar";
      }
    }
  }

  // ===== SORTING =====
  function startSort() {
    if (!wasmModule || !selectedAlgorithm || isRunning) return;

    isRunning = true;
    isSorted = false;
    btnReverse.classList.add("hidden");
    btnReverse.disabled = true;
    statsPanel.classList.add("hidden");
    setControlsDisabled(true);
    clearLastRowStates();

    // Save pre-sort array
    const preSortArray = currentArray.slice();

    // Write current array to WASM memory
    const ptr = wasmModule.getArray();
    const Module = wasmModule._module;
    for (let i = 0; i < currentArray.length; i++) {
      Module.setValue(ptr + i * 4, currentArray[i], 'i32');
    }

    // Call the C++ sorting algorithm (this also records steps)
    wasmModule[selectedAlgorithm](barCount);

    // Read animation steps
    const stepsPtr = wasmModule.getSteps();
    const stepCount = wasmModule.getStepCount();
    const gv = wasmModule.getValue;

    const steps = [];
    for (let i = 0; i < stepCount; i++) {
      const base = stepsPtr + i * 12; // 3 ints * 4 bytes
      steps.push({
        type: gv(base, 'i32'),
        i: gv(base + 4, 'i32'),
        j: gv(base + 8, 'i32'),
      });
    }

    // Read the final sorted array
    readArrayFromWasm();

    // Reset visual array to pre-sort state
    currentArray = preSortArray.slice();
    renderBars();

    // Animate!
    animateSteps(steps, currentArray.slice(), function (swaps, comps) {
      finishSort(swaps, comps);
    });
  }

  function startReverse() {
    if (!wasmModule || isRunning || !isSorted) return;

    isRunning = true;
    setControlsDisabled(true);
    btnReverse.disabled = true;
    statsPanel.classList.add("hidden");
    clearLastRowStates();

    // Save pre-reverse array
    const preReverseArray = currentArray.slice();

    // Write current array to WASM memory
    const ptr = wasmModule.getArray();
    const Module = wasmModule._module;
    for (let i = 0; i < currentArray.length; i++) {
      Module.setValue(ptr + i * 4, currentArray[i], 'i32');
    }

    // Set descending sort order
    wasmModule.setSortOrder(-1);

    // Call the selected sorting algorithm (same one used for sorting)
    wasmModule[selectedAlgorithm](barCount);

    // Reset sort order back to ascending
    wasmModule.setSortOrder(1);

    // Read animation steps
    const stepsPtr = wasmModule.getSteps();
    const stepCount = wasmModule.getStepCount();
    const gv = wasmModule.getValue;

    const steps = [];
    for (let i = 0; i < stepCount; i++) {
      const base = stepsPtr + i * 12;
      steps.push({
        type: gv(base, 'i32'),
        i: gv(base + 4, 'i32'),
        j: gv(base + 8, 'i32'),
      });
    }

    // Read the final reversed array
    readArrayFromWasm();

    // Reset visual to pre-reverse state
    currentArray = preReverseArray.slice();
    renderBars();

    // Animate
    animateSteps(steps, currentArray.slice(), function (swaps, comps) {
      finishReverse(swaps, comps);
    });
  }

  function animateSteps(steps, localArray, onComplete) {
    let stepIndex = 0;
    let prevCompareI = -1;
    let prevCompareJ = -1;
    const sortedSet = new Set();
    let pivotIndex = -1;

    let swapCount = 0;
    let comparisonCount = 0;

    function processStep() {
      if (stepIndex >= steps.length) {
        onComplete(swapCount, comparisonCount);
        return;
      }

      // Clear previous compare highlights by restoring base class
      if (prevCompareI >= 0) {
        updateLastRowBarState(prevCompareI, "");
      }
      if (prevCompareJ >= 0) {
        updateLastRowBarState(prevCompareJ, "");
      }
      prevCompareI = -1;
      prevCompareJ = -1;

      const step = steps[stepIndex];
      stepIndex++;
      
      let nextDelay = SPEEDS[currentSpeed];

      switch (step.type) {
        case STEP_COMPARE:
          updateLastRowBarState(step.i, "comparing");
          updateLastRowBarState(step.j, "comparing");
          prevCompareI = step.i;
          prevCompareJ = step.j;
          comparisonCount++;
          nextDelay = Math.max(1, nextDelay / 4);
          break;

        case STEP_SWAP:
        case STEP_SET:
          if (step.type === STEP_SWAP) {
            const temp = localArray[step.i];
            localArray[step.i] = localArray[step.j];
            localArray[step.j] = temp;
            swapCount++;
          } else {
            localArray[step.i] = step.j;
            swapCount++;
          }

          const highlights = {};
          sortedSet.forEach(idx => { highlights[idx] = "sorted"; });

          if (step.type === STEP_SWAP) {
             highlights[step.i] = "swapping";
             highlights[step.j] = "swapping";
          } else {
             highlights[step.i] = "swapping";
          }

          if (pivotIndex >= 0) highlights[pivotIndex] = "pivot";

          const row = createRow(localArray, highlights);
          barsContainer.appendChild(row);

          const visualizer = document.getElementById("visualizer");
          visualizer.scrollTop = visualizer.scrollHeight;
          break;

        case STEP_SORTED:
          sortedSet.add(step.i);
          setLastRowBaseState(step.i, "sorted");
          if (pivotIndex === step.i) pivotIndex = -1;
          break;

        case STEP_PIVOT:
          if (pivotIndex >= 0 && !sortedSet.has(pivotIndex)) {
            setLastRowBaseState(pivotIndex, "");
          }
          pivotIndex = step.i;
          setLastRowBaseState(step.i, "pivot");
          break;
      }

      animationTimer = setTimeout(processStep, nextDelay);
    }

    processStep();
  }

  function finishSort(swaps, comps) {
    const rows = barsContainer.children;
    if (rows.length === 0) return;
    const bars = rows[rows.length - 1].children;
    for (let i = 0; i < bars.length; i++) {
      setTimeout(function () {
        bars[i].className = "bar sorted celebrate";
      }, i * 25);
    }

    setTimeout(function () {
      isRunning = false;
      setControlsDisabled(false);
      for (let k = 0; k < bars.length; k++) {
        bars[k].className = "bar sorted";
      }
      readArrayFromWasm();
      isSorted = true;
      btnReverse.classList.remove("hidden");
      btnReverse.disabled = false;

      statSwaps.textContent = swaps;
      statComparisons.textContent = comps;
      statTime.textContent = algoStats[selectedAlgorithm].time;
      statSpace.textContent = algoStats[selectedAlgorithm].space;
      statsPanel.classList.remove("hidden");
    }, bars.length * 25 + 500);
  }

  function finishReverse(swaps, comps) {
    const rows = barsContainer.children;
    if (rows.length === 0) return;
    const bars = rows[rows.length - 1].children;
    for (let i = 0; i < bars.length; i++) {
      setTimeout(function () {
        bars[i].className = "bar sorted celebrate";
      }, i * 25);
    }

    setTimeout(function () {
      isRunning = false;
      setControlsDisabled(false);
      for (let k = 0; k < bars.length; k++) {
        bars[k].className = "bar sorted";
      }
      readArrayFromWasm();
      isSorted = false;
      btnReverse.classList.add("hidden");
      btnReverse.disabled = true;

      statSwaps.textContent = swaps;
      statComparisons.textContent = comps;
      statTime.textContent = algoStats[selectedAlgorithm].time;
      statSpace.textContent = algoStats[selectedAlgorithm].space;
      statsPanel.classList.remove("hidden");
    }, bars.length * 25 + 500);
  }

  // ===== UI CONTROLS =====
  function setControlsDisabled(disabled) {
    sizeSlider.disabled = disabled;
    btnGenerate.disabled = disabled;
    btnSort.disabled = disabled;
    btnReverse.disabled = disabled;
    algoButtons.forEach(function (btn) {
      btn.disabled = disabled;
    });
    speedButtons.forEach(function (btn) {
      btn.disabled = disabled;
    });
  }

  function updateSortButton() {
    btnSort.disabled = !selectedAlgorithm || isRunning;
  }

  // Algorithm selection
  algoButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (isRunning) return;
      algoButtons.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      selectedAlgorithm = btn.dataset.algo;
      updateSortButton();
    });
  });

  // Speed selection
  speedButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (isRunning) return;
      speedButtons.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      currentSpeed = btn.dataset.speed;
    });
  });

  // Size slider
  sizeSlider.addEventListener("input", function () {
    barCount = parseInt(sizeSlider.value);
    sizeValue.textContent = barCount;
    generateNewArray();
  });

  // Generate button
  btnGenerate.addEventListener("click", function () {
    generateNewArray();
  });

  // Sort button
  btnSort.addEventListener("click", function () {
    startSort();
  });

  // Reverse button
  btnReverse.addEventListener("click", function () {
    startReverse();
  });
})();
