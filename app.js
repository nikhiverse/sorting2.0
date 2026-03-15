// ===== SORTING VISUALIZER — MAIN APPLICATION =====

(function () {
  "use strict";

  // ===== STATE =====
  let wasmModule = null;
  let currentArray = [];
  let selectedAlgorithm = null;
  let isRunning = false;
  let animationTimer = null;
  let barCount = 24;
  let isSorted = false;

  // Speed map (ms per step)
  const SPEEDS = {
    slow: 120,
    normal: 50,
    fast: 18,
    ultra: 4,
  };
  let currentSpeed = "normal";

  // Step types (mirror C++ defines)
  const STEP_COMPARE = 0;
  const STEP_SWAP = 1;
  const STEP_SORTED = 2;
  const STEP_PIVOT = 3;

  const algoStats = {
    bubbleSort: { time: "O(n²)", space: "O(1)" },
    insertionSort: { time: "O(n²)", space: "O(1)" },
    selectionSort: { time: "O(n²)", space: "O(1)" },
    quickSort: { time: "O(n log n)", space: "O(log n)" },
    heapSort: { time: "O(n log n)", space: "O(1)" },
    mergeSort: { time: "O(n log n)", space: "O(n)" },
    shellSort: { time: "O(n log n)", space: "O(1)" },
    timSort: { time: "O(n log n)", space: "O(n)" },
    treeSort: { time: "O(n log n)", space: "O(n)" }
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
    clearAllBarStates();
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
  function renderBars() {
    barsContainer.innerHTML = "";
    const maxVal = 96;
    for (let i = 0; i < currentArray.length; i++) {
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = ((currentArray[i] / maxVal) * 100) + "%";
      bar.dataset.index = i;
      barsContainer.appendChild(bar);
    }
  }

  function updateBar(index, value) {
    const bars = barsContainer.children;
    if (bars[index]) {
      const maxVal = 96;
      bars[index].style.height = ((value / maxVal) * 100) + "%";
    }
  }

  function setBarState(index, state) {
    const bars = barsContainer.children;
    if (bars[index]) {
      bars[index].className = "bar" + (state ? " " + state : "");
    }
  }

  function clearAllBarStates() {
    const bars = barsContainer.children;
    for (let i = 0; i < bars.length; i++) {
      bars[i].className = "bar";
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
    clearAllBarStates();

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
    clearAllBarStates();

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

      // Clear previous compare highlights (but keep sorted and pivot)
      if (prevCompareI >= 0 && !sortedSet.has(prevCompareI)) {
        setBarState(prevCompareI, pivotIndex === prevCompareI ? "pivot" : "");
      }
      if (prevCompareJ >= 0 && !sortedSet.has(prevCompareJ)) {
        setBarState(prevCompareJ, pivotIndex === prevCompareJ ? "pivot" : "");
      }
      prevCompareI = -1;
      prevCompareJ = -1;

      const step = steps[stepIndex];
      stepIndex++;

      switch (step.type) {
        case STEP_COMPARE:
          setBarState(step.i, "comparing");
          setBarState(step.j, "comparing");
          prevCompareI = step.i;
          prevCompareJ = step.j;
          comparisonCount++;
          break;

        case STEP_SWAP:
          setBarState(step.i, "swapping");
          setBarState(step.j, "swapping");
          prevCompareI = step.i;
          prevCompareJ = step.j;
          swapCount++;

          // Perform the swap on local array and update bars
          const temp = localArray[step.i];
          localArray[step.i] = localArray[step.j];
          localArray[step.j] = temp;
          updateBar(step.i, localArray[step.i]);
          updateBar(step.j, localArray[step.j]);
          break;

        case STEP_SORTED:
          sortedSet.add(step.i);
          setBarState(step.i, "sorted");
          if (pivotIndex === step.i) pivotIndex = -1;
          break;

        case STEP_PIVOT:
          if (pivotIndex >= 0 && !sortedSet.has(pivotIndex)) {
            setBarState(pivotIndex, "");
          }
          pivotIndex = step.i;
          setBarState(step.i, "pivot");
          break;
      }

      animationTimer = setTimeout(processStep, SPEEDS[currentSpeed]);
    }

    processStep();
  }

  function finishSort(swaps, comps) {
    // Mark all bars as sorted with a cascade effect
    const bars = barsContainer.children;
    for (let i = 0; i < bars.length; i++) {
      setTimeout(function () {
        bars[i].className = "bar sorted celebrate";
      }, i * 25);
    }

    setTimeout(function () {
      isRunning = false;
      setControlsDisabled(false);
      // Remove celebrate class
      for (let k = 0; k < bars.length; k++) {
        bars[k].className = "bar sorted";
      }
      // Update currentArray to sorted
      readArrayFromWasm();
      isSorted = true;
      btnReverse.classList.remove("hidden");
      btnReverse.disabled = false;

      // Update and show stats
      statSwaps.textContent = swaps;
      statComparisons.textContent = comps;
      statTime.textContent = algoStats[selectedAlgorithm].time;
      statSpace.textContent = algoStats[selectedAlgorithm].space;
      statsPanel.classList.remove("hidden");
    }, bars.length * 25 + 500);
  }

  function finishReverse(swaps, comps) {
    // Mark all bars with a cascade effect
    const bars = barsContainer.children;
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

      // Update and show stats
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
